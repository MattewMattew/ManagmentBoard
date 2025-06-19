// backend/db.js
const knex = require('knex');
const config = require('./knexfile');

// Используем окружение development по умолчанию
const environment = process.env.NODE_ENV || 'development';
const db = knex(config[environment]);

// Проверка подключения к базе данных
async function testConnection() {
  try {
    await db.raw('SELECT 1+1 AS result');
    console.log('✅ Подключение к базе данных успешно');
    return true;
  } catch (error) {
    console.error('❌ Ошибка подключения к базе данных:', error);
    return false;
  }
}

// Выполнение миграций
async function migrateLatest() {
  try {
    await db.migrate.latest();
    console.log('✅ Миграции успешно выполнены');
    return true;
  } catch (error) {
    console.error('❌ Ошибка выполнения миграций:', error);
    return false;
  }
}

module.exports = {
  db,
  testConnection,
  migrateLatest
};