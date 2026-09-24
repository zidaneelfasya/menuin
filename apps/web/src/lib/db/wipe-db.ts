import { db } from './index';
import { sql } from 'drizzle-orm';

async function wipeDatabase() {
  console.log('Memulai proses penghapusan seluruh data dari database...');
  try {
    // Drop all tables and their contents
    const query = sql`
      DO $$ DECLARE
          r RECORD;
      BEGIN
          FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
              EXECUTE 'TRUNCATE TABLE ' || quote_ident(r.tablename) || ' CASCADE';
          END LOOP;
      END $$;
    `;
    
    await db.execute(query);
    console.log('✅ Semua isi tabel berhasil dihapus.');
  } catch (error) {
    console.error('❌ Gagal menghapus isi tabel:', error);
  }
  
  process.exit(0);
}

wipeDatabase();
