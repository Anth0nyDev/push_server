const express = require('express');
const bodyParser = require('body-parser');
const webpush = require('web-push');
const cors = require('cors');
const mysql = require('mysql2/promise'); // Используем promise-версию

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

// Настройка соединения с MySQL
const dbConfig = {
  host: 'localhost',     // замените на ваши параметры
  user: 'root',
  password: '',
  database: 'chatbd'
};

// Функция для получения всех подписок из базы
async function getSubscriptions() {
  const connection = await mysql.createConnection(dbConfig);
  const [rows] = await connection.execute('SELECT * FROM subscriptions');
  await connection.end();
  
  // Преобразуем строки в формат, ожидаемый webpush
  return rows.map(row => ({
    endpoint: row.endpoint,
    keys: {
      auth: row.keys_auth,
      p256dh: row.keys_p256dh
    }
  }));
}

// Эндпоинт для получения подписки от клиента и сохранения в базу
app.post('/subscribe', async (req, res) => {
  const subscription = req.body;

  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute(
      'INSERT INTO subscriptions (endpoint, keys_auth, keys_p256dh) VALUES (?, ?, ?)',
      [
        subscription.endpoint,
        subscription.keys.auth,
        subscription.keys.p256dh
      ]
    );
    await connection.end();

    console.log('Подписка добавлена:', subscription);
    res.status(201).json({ message: 'Подписка успешно добавлена' });
  } catch (error) {
    console.error('Ошибка при сохранении подписки:', error);
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
    const subscriptions = await getSubscriptions();

    const sendPromises = subscriptions.map(sub => 
      webpush.sendNotification(sub, payload).catch(error => {
        console.error('Ошибка при отправке уведомления:', error);
        // Можно добавить логику удаления неподдерживаемых подписок из базы здесь
      })
    );

    await Promise.all(sendPromises);
    res.json({ message: 'Уведомления отправлены' });
    
  } catch (error) {
    console.error('Ошибка при получении подписок или отправке уведомлений:', error);
    res.status(500).json({ error: 'Ошибка при отправке уведомлений' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});