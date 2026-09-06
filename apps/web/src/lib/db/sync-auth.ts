import postgres from 'postgres';
import * as dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('DATABASE_URL is not set!');
  process.exit(1);
}

const sql = postgres(connectionString, { prepare: false });

async function syncAuth() {
  console.log('🔄 Menyelaraskan Supabase Auth untuk seluruh user demo...');

  try {
    const publicUsers = await sql`SELECT id, email, name, role FROM public.users`;
    console.log(`Ditemukan ${publicUsers.length} user di tabel public.users.`);

    await sql`CREATE EXTENSION IF NOT EXISTS pgcrypto;`;

    for (const u of publicUsers) {
      const email = u.email.toLowerCase().trim();
      const name = (u.name || email).toString();
      const meta = JSON.stringify({ name });
      const appMeta = JSON.stringify({ provider: 'email', providers: ['email'] });

      const existingAuth = await sql`SELECT id FROM auth.users WHERE LOWER(email) = ${email}`;

      let userId: string;

      if (existingAuth.length > 0) {
        userId = existingAuth[0].id;
        await sql`
          UPDATE auth.users
          SET 
            encrypted_password = extensions.crypt('password123', extensions.gen_salt('bf')),
            email_confirmed_at = NOW(),
            raw_app_meta_data = ${appMeta}::jsonb,
            raw_user_meta_data = ${meta}::jsonb,
            updated_at = NOW()
          WHERE id = ${userId}
        `;
        console.log(`✅ Updated Auth: ${email}`);
      } else {
        userId = crypto.randomUUID();
        await sql`
          INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            aud,
            role,
            created_at,
            updated_at
          ) VALUES (
            ${userId},
            '00000000-0000-0000-0000-000000000000',
            ${email},
            extensions.crypt('password123', extensions.gen_salt('bf')),
            NOW(),
            ${appMeta}::jsonb,
            ${meta}::jsonb,
            'authenticated',
            'authenticated',
            NOW(),
            NOW()
          )
        `;
        console.log(`✨ Created Auth: ${email}`);
      }

      // Pastikan ada di auth.identities
      const identData = JSON.stringify({ sub: userId, email });
      await sql`
        INSERT INTO auth.identities (
          id,
          user_id,
          identity_data,
          provider,
          provider_id,
          last_sign_in_at,
          created_at,
          updated_at
        ) VALUES (
          ${userId},
          ${userId},
          ${identData}::jsonb,
          'email',
          ${userId},
          NOW(),
          NOW(),
          NOW()
        )
        ON CONFLICT (provider, provider_id) DO UPDATE
        SET identity_data = ${identData}::jsonb,
            updated_at = NOW();
      `;
    }

    console.log('\n🎉 Selesai! Seluruh akun sekarang terkonfirmasi aktif di Supabase Auth.');
    console.log('Password untuk SEMUA akun adalah: password123');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Gagal sinkronisasi auth:', err);
    await sql.end();
    process.exit(1);
  }
}

syncAuth();
