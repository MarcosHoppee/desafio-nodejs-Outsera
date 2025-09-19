import { FastifyInstance } from 'fastify'
import { knex } from '../database/knex-config-db'
import { getProducerIntervals } from '../controllers/producerController'

export async function producersRoutes(app: FastifyInstance) {
  app.get("/intervals", getProducerIntervals);

  app.get('/movies', async () => {
    const movies = await knex('producerMovies').select('*')

    return { movies }
  })
}