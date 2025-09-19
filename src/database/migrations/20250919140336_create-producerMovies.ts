import type { Knex } from "knex";

export async function up(knex: Knex): Promise<void> {
   await knex.schema.createTable('producerMovies', (table) => {
    table.uuid('id').primary()
    table.integer('year').notNullable();
    table.string('title').notNullable();
    table.string('studio').notNullable();
    table.string('producer').notNullable();
    table.boolean('winner').notNullable().defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.index(['producer', 'year']);
  })
}


export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTable('producerMovies');  
}

