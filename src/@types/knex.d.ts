import 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    producerMovies: {
      id: string
      year: number
      title: string
      studio: string
      producer: string
      winner: boolean
      created_at: string
    }
  }
}

