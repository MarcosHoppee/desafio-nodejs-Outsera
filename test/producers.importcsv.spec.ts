import { it, afterAll, beforeAll, beforeEach, expect, describe } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';
import { knex } from '../src/database/knex-config-db';
import { importProducersFromCSV } from '../src/services/producerDbImporter';
import path from 'node:path';
import fs from 'fs';

describe('producers integration - import from CSV', () => {
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

  it('should import producers from any CSV in resources and return correct intervals', async () => {
    const resourcesDir = path.join(__dirname, '../resources');
    const files = fs.readdirSync(resourcesDir);
    const csvFiles = files.filter((file) => file.toLowerCase().endsWith('.csv'));

    if (csvFiles.length === 0) {
      throw new Error('Nenhum arquivo CSV encontrado na pasta /resources.');
    }

    try {
      for (const csvFile of csvFiles) {
        const csvFilePath = path.join(resourcesDir, csvFile);
        await importProducersFromCSV(csvFilePath);
      }
    } catch (err: any) {
      throw new Error('Erro ao importar CSV: ' + (err && err.message ? err.message : String(err)));
    }

    const response = await request(app.server)
      .get('/producers/intervals')
      .expect(200);

    expect(response.body).toHaveProperty('min');
    expect(response.body).toHaveProperty('max');
    expect(Array.isArray(response.body.min)).toBe(true);
    expect(Array.isArray(response.body.max)).toBe(true);

    expect(response.body.min.length).toBeGreaterThan(0);
    expect(response.body.max.length).toBeGreaterThan(0);

    response.body.min.forEach((item: any) => {
      expect(item).toEqual(
        expect.objectContaining({
          producer: expect.any(String),
          interval: expect.any(Number),
          previousWin: expect.any(Number),
          followingWin: expect.any(Number),
        })
      );
    });

    response.body.max.forEach((item: any) => {
      expect(item).toEqual(
        expect.objectContaining({
          producer: expect.any(String),
          interval: expect.any(Number),
          previousWin: expect.any(Number),
          followingWin: expect.any(Number),
        })
      );
    });
  });
});
