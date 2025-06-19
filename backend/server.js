require('dotenv').config();
const express = require('express');
const cors = require('cors');
const knex = require('knex');
const axios = require('axios');
const moment = require('moment');
const fs = require('fs');
const config = require('./knexfile');
const { db, testConnection, migrateLatest } = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

// Константы
const REDMINE_URL = process.env.REDMINE_URL || "https://helpdesk.fenix-it.ru/";
const TRACKER_URL = process.env.TRACKER_URL || "https://tracker.fenix-it.ru/";
const USERS = [369, 338, 207, 84, 86, 14, 83, 73, 164];
const STATUS_IDS = [1, 4, 8, 9, 10, 11, 12, 13, 27, 15, 16, 23, 24, 25, 26, 28, 29, 30, 31, 33, 34, 35, 36, 37, 38, 39];

// Проверка подключения к БД и выполнение миграций
async function initializeDatabase() {
  const isConnected = await testConnection();
  if (!isConnected) {
    process.exit(1);
  }
  
  await migrateLatest();
}

// Функция для получения всех страниц данных
async function fetchAllPages(url, headers, dataKey) {
  let allData = [];
  let offset = 0;
  const limit = 100;

  try {
    while (true) {
      const response = await axios.get(`${url}&offset=${offset}&limit=${limit}`, { headers });
      const data = response.data;
      
      if (!data[dataKey] || data[dataKey].length === 0) break;
      
      allData = [...allData, ...data[dataKey]];
      offset += limit;

      console.log(`Fetched ${allData.length} items so far from ${dataKey}...`);
      console.log(`Current offset: ${offset}, Total count: ${data.total_count}`);
      
      if (offset >= data.total_count) break;
    }
    
    return allData;
  } catch (error) {
    console.error('Ошибка при получении данных:', error.message);
    return [];
  }
}

// Маршруты
app.get('/check-api-keys', (req, res) => {
  const helpdeskExists = fs.existsSync("helpdesk_key.txt");
  const trackerExists = fs.existsSync("tracker_key.txt");
  res.json({ helpdesk_exists: helpdeskExists, tracker_exists: trackerExists });
});

app.post('/save-api-keys', (req, res) => {
  try {
    const { helpdesk_key, tracker_key } = req.body;
    
    if (helpdesk_key) {
      fs.writeFileSync("helpdesk_key.txt", helpdesk_key);
    }
    
    if (tracker_key) {
      fs.writeFileSync("tracker_key.txt", tracker_key);
    }
    
    res.json({ success: true, message: 'Ключи успешно сохранены' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Синхронизация задач с Redmine
app.get('/sync-issues', async (req, res) => {
  try {
    const helpdeskKey = fs.readFileSync("helpdesk_key.txt", "utf8").trim();
    const headers = {
      "Content-Type": "application/json",
      "X-Redmine-API-Key": helpdeskKey
    };
    console.log(`Using Redmine API Key: ${helpdeskKey}`);
    const filterUrl = `${REDMINE_URL}/issues.json?f[]=project_id&op[project_id]=%21&v[project_id][]=26&v[project_id][]=28&v[project_id][]=34&v[project_id][]=32&v[project_id][]=35&f[]=created_on&op[created_on]=>=&v[created_on][]=2023-10-30&limit=100`;
    console.log(`Fetching issues from: ${filterUrl}`);
    const issues = await fetchAllPages(filterUrl, headers, 'issues');
    console.log(`Fetched ${issues.length} issues from Redmine`);

    // Пакетное сохранение задач
    const batchSize = 100;
    for (let i = 0; i < issues.length; i += batchSize) {
      const batch = issues.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(issues.length / batchSize)}`);
      await db.transaction(async trx => {
        for (const issue of batch) {
          const createdOn = issue.created_on ? moment(issue.created_on).toDate() : null; // Преобразуем created_on в дату
          await trx('issues')
            .insert({
              redmine_id: issue.id,
              data: JSON.stringify(issue),
              created_at: createdOn, // Устанавливаем дату из created_on
              updated_at: db.fn.now()
            })
            .onConflict('redmine_id') // Обработка конфликта по redmine_id
            .merge(); // Обновляем существующую запись
        }
      });
    }

    res.json({ success: true, count: issues.length });
  } catch (error) {
    console.error('Error in /sync-issues:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/issues', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-cache');
  try {
    const issues = await db('issues').select('*');
    res.json(
      issues.map(issue => ({
        ...issue,
        data: typeof issue.data === 'string' ? JSON.parse(issue.data) : issue.data
      }))
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Запуск сервера
const PORT = process.env.PORT || 5000;
initializeDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
  });
});