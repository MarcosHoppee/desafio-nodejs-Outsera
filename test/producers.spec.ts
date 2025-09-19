import { it, afterAll, beforeAll, beforeEach, expect, describe } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'
import { knex } from '../src/database/knex-config-db'
import { execSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'

describe('procedures routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should return the correct min and max producer intervals', async () => { 
    await knex('producerMovies').insert([
      {
        id: randomUUID(),
        year: 2008,
        title: 'Filme 1',
        studio: 'Studio 1',
        producer: 'Producer A',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2009,
        title: 'Filme 2',
        studio: 'Studio 1',
        producer: 'Producer A',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2000,
        title: 'Filme A',
        studio: 'Studio 2',
        producer: 'Producer B',
        winner: true,
      },
      {
        id: randomUUID(),
        year: 2099,
        title: 'Filme B',
        studio: 'Studio 2',
        producer: 'Producer B',
        winner: true,
      },
    ])

    const listProducersWinnerResponse = await request(app.server)
      .get('/producers/intervals')
      .expect(200)


    expect(listProducersWinnerResponse.body).toEqual({
      min: [
        {
          producer: 'Producer A',
          interval: 1,
          previousWin: 2008,
          followingWin: 2009,
        }
      ],
      max: [
        {
          producer: 'Producer B',
          interval: 99,
          previousWin: 2000,
          followingWin: 2099,
        },
      ],
    })
  })

  it('should return min and max arrays with the expected structure', async () => {
    const listProducersWinnerResponse = await request(app.server)
      .get('/producers/intervals')
      .expect(200)

    expect(Array.isArray(listProducersWinnerResponse.body.min)).toBe(true)
    expect(Array.isArray(listProducersWinnerResponse.body.max)).toBe(true)
    expect(listProducersWinnerResponse.body).toHaveProperty('min')
    
    listProducersWinnerResponse.body.min.forEach((itemMin: any)  => {
      expect(itemMin).toEqual(
        expect.objectContaining({
          producer: expect.any(String),
          interval: expect.any(Number),
          previousWin: expect.any(Number),
          followingWin: expect.any(Number),
        })
      )
    })

    listProducersWinnerResponse.body.max.forEach((itemMax : any) => {
      expect(itemMax).toEqual(
        expect.objectContaining({
          producer: expect.any(String),
          interval: expect.any(Number),
          previousWin: expect.any(Number),
          followingWin: expect.any(Number),
        })
      )
    })
  })
})
