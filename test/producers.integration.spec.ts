import { it, afterAll, beforeAll, beforeEach, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { knex } from '../src/database/knex-config-db';
import { randomUUID } from 'node:crypto';

describe('producers integration tests', () => {
  beforeAll(async () => {
    await app.ready();
    await knex.migrate.rollback(undefined, true);
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.destroy();
    await app.close();
  });

  beforeEach(async () => {
    await knex('producerMovies').del();
  });

  it('should return empty min and max arrays when no winners', async () => {
    await knex('producerMovies').insert([
      {
        id: randomUUID(),
        year: 2010,
        title: 'Filme Sem Prêmio', 
        studio: 'Studio X',
        producer: 'Producer X',
        winner: false,
      },
      {
        id: randomUUID(),
        year: 2011,
        title: 'Filme Sem Prêmio 2',
        studio: 'Studio X',
        producer: 'Producer X',
        winner: false,
      },
    ]);
    const response = await request(app.server)
      .get('/producers/intervals')
      .expect(200);
    expect(response.body).toEqual({ min: [], max: [] });
  });

  it('should return empty min and max arrays when only one win per producer', async () => {
    await knex('producerMovies').insert([
      {
        id: randomUUID(),
        year: 2012,
        title: 'Filme Único',
        studio: 'Studio Y',
        producer: 'Producer Y',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2013,
        title: 'Filme Único 2',
        studio: 'Studio Z',
        producer: 'Producer Z',
        winner: true,
      },
    ]);
    const response = await request(app.server)
      .get('/producers/intervals')
      .expect(200);
    expect(response.body).toEqual({ min: [], max: [] });
  });

  it('should handle multiple producers with same min interval', async () => {
    await knex('producerMovies').insert([
      {
        id: randomUUID(),
        year: 2000,
        title: 'Filme 1',
        studio: 'Studio 1',
        producer: 'Producer A',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2002,
        title: 'Filme 2',
        studio: 'Studio 1',
        producer: 'Producer A',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2010,
        title: 'Filme 3',
        studio: 'Studio 2',
        producer: 'Producer B',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2012,
        title: 'Filme 4',
        studio: 'Studio 2',
        producer: 'Producer B',
        winner: true,
      },
    ]);
    const response = await request(app.server)
      .get('/producers/intervals')
      .expect(200);
    expect(response.body.min).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          producer: 'Producer A',
          interval: 2,
          previousWin: 2000,
          followingWin: 2002,
        }),
        expect.objectContaining({
          producer: 'Producer B',
          interval: 2,
          previousWin: 2010,
          followingWin: 2012,
        })
      ])
    );
  });
});
