const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors'); // импортируем cors
const webpush = require('web-push');

const app = express();

// Включаем CORS для всех источников или указываем конкретный
app.use(cors()); // разрешает все источники, безопасно для разработки

app.use(bodyParser.json());

// Вставьте сюда ваши VAPID ключи
const vapidPublicKey = 'BJNcpLE4xVse6XXpobHzdIrBovVp_6JytrGK7XQ3cxTpdfIcXq_3wH-4PfPnY2fpYoBlUNkHTq1MPFgpXqEkbfo';
const vapidPrivateKey = '2ozGZ_BsPFszXwpGTnRAm4JSjrdcfEtAJHgLz05S--E';

webpush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidPublicKey,
  vapidPrivateKey
);

// Храним подписки в памяти (для продакшена используйте базу)
const subscriptions = [];

// Эндпоинт для получения подписки от клиента
app.post('/subscribe', (req, res) => {
  const subscription = req.body;
  console.log('Подписка получена:', subscription);
  // Здесь можно сохранить подписку или выполнить другие действия
  res.status(201).json({ message: 'Подписка успешно получена' });
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
  
  res.status(200).json({ message: 'Уведомления отправлены' });
});

const PORT = process.env.PORT || 3000;app.listen(PORT, () => {  console.log(`Сервер запущен на порту ${PORT}`);});