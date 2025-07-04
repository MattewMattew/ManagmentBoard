exports.up = function(knex) {
  return knex.schema.createTable('issues', function(table) {
    table.increments('id').primary();
    table.integer('redmine_id').unique().notNullable();
    table.json('data').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('issues');
};