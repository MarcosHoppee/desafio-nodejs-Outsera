import { it, afterAll, beforeAll, beforeEach, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { knex } from '../src/database/knex-config-db';
import { randomUUID } from 'node:crypto';

describe('producers structure tests', () => {
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

  it('must return the correct ranges according to the proposal data', async () => {
    await knex('producerMovies').insert([
      {
        id: randomUUID(),
        year: 1980,
        title: 'Filme X',
        studio: 'Studio X',
        producer: 'Producer Test',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 1985,
        title: 'Filme Y',
        studio: 'Studio X',
        producer: 'Producer Test',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 1990,
        title: 'Filme Z',
        studio: 'Studio Y',
        producer: 'Producer Test',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2000,
        title: 'Filme W',
        studio: 'Studio Y',
        producer: 'Producer Test',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 1995,
        title: 'Filme A',
        studio: 'Studio Z',
        producer: 'Producer Another',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2005,
        title: 'Filme B',
        studio: 'Studio Z',
        producer: 'Producer Another',
        winner: true,
      },
    ]);

    const response = await request(app.server)
      .get('/producers/intervals')
      .expect(200);

    expect(response.body).toHaveProperty('min');
    expect(response.body).toHaveProperty('max');
    expect(Array.isArray(response.body.min)).toBe(true);
    expect(Array.isArray(response.body.max)).toBe(true);

    expect(response.body.min).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          producer: 'Producer Test',
          interval: 5,
          previousWin: 1980,
          followingWin: 1985,
        }),
        expect.objectContaining({
          producer: 'Producer Test',
          interval: 5,
          previousWin: 1985,
          followingWin: 1990,
        })
      ])
    );
    expect(response.body.max).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          producer: 'Producer Test',
          interval: 10,
          previousWin: 1990,
          followingWin: 2000,
        }),
        expect.objectContaining({
          producer: 'Producer Another',
          interval: 10,
          previousWin: 1995,
          followingWin: 2005,
        })
      ])
    );
  });
});
