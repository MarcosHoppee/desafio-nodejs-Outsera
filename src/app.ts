import fastify from 'fastify';
import { producersRoutes } from './routes/producers';
import { knex } from './database/knex-config-db';

export const app = fastify();

app.register(producersRoutes, {
  prefix: '/producers',
});

export async function setupDatabase() {
  try {
    await knex.migrate.latest();
    console.log('Migrations successfully implemented!');
  } catch (err) {
    console.error('Error running migrations', err);
    process.exit(1);
  }
}
