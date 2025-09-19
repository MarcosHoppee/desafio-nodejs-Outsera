import fs from 'fs';
import path from 'path';
import { app, setupDatabase } from './app';
import { env } from './env';
import { importProducersFromCSV } from './services/producerDbImporter';

async function startServer() {
  try {
    await setupDatabase();
    const resourcesDir = path.join(__dirname, 'resources');

    if (!fs.existsSync(resourcesDir)) {
      throw new Error(`Pasta não encontrada: ${resourcesDir}`);
    }

    const files = fs.readdirSync(resourcesDir);
    const csvFiles = files.filter(file => file.toLowerCase().endsWith('.csv'));
  
    if (csvFiles.length === 0) {
      console.log('Nenhum arquivo CSV encontrado na pasta src/resources. Servidor será iniciado sem importar dados.');
    } else {
      for (const csvFile of csvFiles) {
        const csvFilePath = path.join(resourcesDir, csvFile);
        console.log(`Importando dados do arquivo: ${csvFilePath}`);
        await importProducersFromCSV(csvFilePath);
        console.log(`Dados do arquivo ${csvFile} carregados no banco!`);
      }
    }

    await app.listen({ 
      port: env.PORT 
    });
    console.log('HTTP Server Running!')
  } catch (err) {
    console.error('Erro ao iniciar a aplicação:', err);
    process.exit(1);
  }
}

startServer();
