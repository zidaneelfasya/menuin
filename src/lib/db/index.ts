import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

let connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/postgres';

try {
  const match = connectionString.match(/^(postgresql?:\/\/[^:]+:)(.*)(@[^@]+:\d+\/[^?]+.*)$/);
  if (match) {
    const password = match[2];
    if (password.includes('@') || password.includes('#') || password.includes('!')) {
      const encodedPassword = encodeURIComponent(password);
      connectionString = match[1] + encodedPassword + match[3];
    }
  }
} catch (e) {
  console.error("Failed to parse DB URL", e);
}

// Disable prepare as it is not supported for "Transaction" pool mode in Supabase
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
