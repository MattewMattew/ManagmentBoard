const knex = require('knex');
const config = require('./knexfile').development;

async function waitForDatabase() {
  const maxAttempts = 10;
  let attempt = 0;

  const db = knex(config);

  while (attempt < maxAttempts) {
    try {
      await db.raw('SELECT 1');
      console.log('✅ Подключение к БД установлено');
      await db.destroy();
      return;
    } catch (err) {
      attempt++;
      console.log(`⏳ Ожидание БД... попытка ${attempt}`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.error('❌ Превышено количество попыток подключения к БД');
  process.exit(1);
}

waitForDatabase();