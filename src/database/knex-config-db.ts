import 'dotenv/config'
import { Knex, knex as setupKnex } from 'knex'

export const config: Knex.Config = {
  client: 'sqlite3',
  connection: {
    filename: ":memory:",
  },
  useNullAsDefault: true,
  migrations: {
    extension: 'ts',
    directory: './src/database/migrations',
  },
}

export const knex = setupKnex(config)