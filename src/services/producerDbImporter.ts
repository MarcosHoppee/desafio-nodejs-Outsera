import fs from 'node:fs';
import path from 'node:path';
import csv from 'csv-parser';
import knex from 'knex';
import { randomUUID } from 'node:crypto';
import { config } from '../database/knex-config-db';

const db = knex(config);

interface ProducerMovie {
  id: string;
  year: number;
  title: string;
  studio: string;
  producer: string;
  winner: boolean;
}

export async function importProducersFromCSV(csvFilePath: string) {
  return new Promise<void>((resolve, reject) => {
    const results: ProducerMovie[] = [];

    fs.createReadStream(csvFilePath)
      .pipe(csv({ separator: ';' }))
      .on('data', (data: any) => {
        if (!data.title && !data.producers) return;
        const producerStr = data.producers.replace(/ and /gi, ',');
        const listProducers = producerStr
          .split(',')
          .map((p: string) => p.trim())
          .filter(Boolean);

        for (const producer of listProducers) {
          results.push({
            id: randomUUID(),
            year: parseInt(data.year, 10),
            title: data.title,
            studio: data.studios || '',
            producer,
            winner: data.winner?.toLowerCase() === 'yes',
          });
        }
      })
      .on('end', async () => {
        try {
          if (results.length === 0) {
            console.log('Nenhum registro válido encontrado no CSV. Nenhuma inserção foi feita.');
            return resolve();
          }
          await db.migrate.latest();
          await db('producerMovies').del();
          await db('producerMovies').insert(results);

          console.log(`Import completed successfully! Total records: ${results.length}`);
          resolve();
        } catch (error) {
          console.error('Error when importing:', error);
          reject(error);
        }
      })
      .on('error', (err: any) => {
        console.error('Error reading CSV file:', err);
        reject(err);
      });
  });
}

const resourcesPath = path.resolve(__dirname, '../resources');
const files = fs.readdirSync(resourcesPath);
const firstCsvFile = files.find(file => file.endsWith('.csv'));

if (!firstCsvFile) {
  console.error('No CSV file found in resources folder.');
  process.exit(1);
}

const csvFilePath = path.join(resourcesPath, firstCsvFile);

importProducersFromCSV(csvFilePath)
  .then(() => console.log('Import completed.'))
  .catch(err => console.error('Import error', err));
