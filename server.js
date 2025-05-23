const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');

const app = express();

const SUBSCRIPTIONS_API_URL = 'http://f96473fl.beget.tech/push_server/save_subscription.php';

app.use(cors()); // должно быть перед маршрутами

app.use(bodyParser.json());

// Вставьте сюда ваши VAPID ключи
const vapidPublicKey = 'BJNcpLE4xVse6XXpobHzdIrBovVp_6JytrGK7XQ3cxTpdfIcXq_3wH-4PfPnY2fpYoBlUNkHTq1MPFgpXqEkbfo';
const vapidPrivateKey = '2ozGZ_BsPFszXwpGTnRAm4JSjrdcfEtAJHgLz05S--E';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

// Добавление новой подписки через PHP API
async function addSubscription(subscription) {
  const response = await fetch(SUBSCRIPTIONS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription)
  });

  const responseText = await response.text(); // или response.json(), если сервер возвращает JSON
  console.log('Ответ сервера:', responseText);
}

// Эндпоинт для получения подписки от клиента
app.post('/subscribe', async (req, res) => {
  const subscription = req.body;
  try {
    await addSubscription(subscription);
    console.log('Подписка добавлена:', subscription);
    res.status(201).json({ message: 'Подписка успешно добавлена' });
  } catch (err) {
    console.error('Ошибка при добавлении подписки:', err);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Эндпоинт для отправки уведомлений всем подпискам
app.post('/sendNotification', async (req, res) => {
  const notificationPayload = {
    title: 'Новое сообщение',
    body: 'У вас новое сообщение в чате!',
    icon: '/icon.png'
  };

  const payload = JSON.stringify(notificationPayload);

  const sendPromises = subscriptions.map(sub => 
    webpush.sendNotification(sub, payload).catch(error => {
      console.error('Ошибка при отправке уведомления:', error);
    })
  );

  await Promise.all(sendPromises);
  
  res.json({ message: 'Уведомления отправлены' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});