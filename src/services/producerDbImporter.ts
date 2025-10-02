import fs from 'node:fs';
import csv from 'csv-parser';
import { knex } from '../database/knex-config-db';
import { randomUUID } from 'node:crypto';

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
          await knex('producerMovies').insert(results);

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
