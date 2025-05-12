const express = require('express');
const mysql = require('mysql2');

const app = express();
app.use(express.json());

// Подключение к MySQL с retry
function connectWithRetry() {
  console.log('Попытка подключения к MySQL...');

  const db = mysql.createConnection({
    host: process.env.DB_HOST || 'mysql', // ← имя сервиса из docker-compose
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'redmine_board',
    port: 3306,
    connectTimeout: 10000 // 10 секунд таймаут
  });

  db.connect((err) => {
    if (err) {
      console.error('Ошибка подключения к MySQL:', err.message);
      setTimeout(connectWithRetry, 5000); // Повтор через 5 сек
    } else {
      console.log('Подключено к MySQL');

      // Пример маршрута
      app.get('/api/hello', (req, res) => {
        res.json({ message: 'Привет с бэкенда!' });
      });

      // Пример таблицы
      app.get('/api/tasks', (req, res) => {
        db.query('SELECT * FROM tasks', (err, results) => {
          if (err) return res.status(500).json({ error: err });
          res.json(results);
        });
      });
      // Удаление задачи
      app.delete('/api/tasks/:id', (req, res) => {
        const { id } = req.params;
        db.query('DELETE FROM tasks WHERE id = ?', [id], (err, result) => {
          if (err) return res.status(500).json({ error: err });
          res.json({ message: 'Задача удалена' });
        });
      });

      // Маршрут для добавления задачи
      app.post('/api/tasks', (req, res) => {
        const { title } = req.body;

        if (!title || typeof title !== 'string') {
          return res.status(400).json({ error: 'Поле title обязательно' });
        }

        db.query(
          'INSERT INTO tasks (title, completed) VALUES (?, ?)',
          [title, false],
          (err, result) => {
            if (err) {
              console.error('Ошибка при добавлении задачи:', err);
              return res.status(500).json({ error: 'Не удалось добавить задачу' });
            }
            res.json({ id: result.insertId, title, completed: false });
          }
        );
      });

      const PORT = process.env.PORT || 5000;
      app.listen(PORT, () => {
        console.log(`Бэкенд слушает на порту ${PORT}`);
      });
    }
  });
}

connectWithRetry();