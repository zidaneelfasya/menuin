import postgres from 'postgres';
import * as dotenv from 'dotenv';
import { execSync } from 'child_process';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, prepare: false });

async function resetDb() {
  try {
    console.log('⚠️ WARNING: Dropping public schema CASCADE to completely reset database...');
    await sql.unsafe('DROP SCHEMA public CASCADE;');
    await sql.unsafe('CREATE SCHEMA public;');
    await sql.unsafe('GRANT ALL ON SCHEMA public TO postgres;');
    await sql.unsafe('GRANT ALL ON SCHEMA public TO public;');
    console.log('✅ Public schema reset successfully.');
    
    // Clear drizzle migrations folder history locally so it matches DB
    console.log('🔄 Cleaning up local drizzle migration history...');
    execSync('npx rimraf drizzle');
    
    console.log('🚀 Generating fresh migration from current schema.ts...');
    execSync('npm run db:generate', { stdio: 'inherit' });
    
    console.log('🚀 Pushing fresh migration to database...');
    // Execute migration directly using migrate.ts
    execSync('npx tsx src/lib/db/migrate.ts', { stdio: 'inherit' });
    
    console.log('🌱 Running Database Seed...');
    execSync('npm run db:seed', { stdio: 'inherit' });
    
    console.log('🎉 Database fully reset and seeded successfully!');
  } catch (err) {
    console.error('❌ Error during DB reset:', err);
  } finally {
    await sql.end();
  }
}

resetDb();
