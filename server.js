const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');
const axios = require('axios');

const app = express();

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

// Эндпоинт для получения подписки от клиента и сохранения в базу
app.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  try {
    const response = await axios.post('http://f96473fl.beget.tech/push_server/save_subscription.php', subscription);
    console.log('Ответ PHP:', response.data);
    res.status(201).json({ message: 'Подписка успешно добавлена' });
  } catch (error) {
    console.error('Ошибка при отправке на PHP:', error.response?.data || error.message);
    res.status(500).json({ error: 'Ошибка при сохранении подписки' });
  }
});

// Эндпоинт для отправки уведомлений всем подпискам из базы
app.post('/sendNotification', async (req, res) => {
  const notificationPayload = {
    title: 'Новое сообщение',
    body: 'У вас новое сообщение в чате!',
    icon: '/icon.png'
  };

  const payload = JSON.stringify(notificationPayload);

  try {
    // Получаем все подписки из базы (через PHP или напрямую)
    const response = await axios.get('http://f96473fl.beget.tech/push_server/get_subscriptions.php');
    const subscriptions = response.data;

    // Отправляем уведомление каждому
    const sendPromises = subscriptions.map(sub =>
      webpush.sendNotification(sub, payload).catch(error => {
        console.error('Ошибка при отправке:', error);
        // Можно добавить логику удаления неподдерживаемых подписок
      })
    );

    await Promise.all(sendPromises);
    res.json({ message: 'Уведомления отправлены' });
  } catch (error) {
    console.error('Ошибка при получении подписок или отправке:', error);
    res.status(500).json({ error: 'Ошибка при рассылке' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});