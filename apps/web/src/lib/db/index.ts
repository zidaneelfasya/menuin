import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';



declare global {
  // eslint-disable-next-line no-var
  var __db_client: postgres.Sql | undefined;
}

// Disable prepare as it is not supported for "Transaction" pool mode in Supabase
const client =
  globalThis.__db_client ??
  postgres(connectionString, {
    prepare: false,
    max: process.env.NODE_ENV === 'production' ? 10 : 5,
    idle_timeout: 20,
    connect_timeout: 10,
  });

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db_client = client;
}

export const db = drizzle(client, { schema });
