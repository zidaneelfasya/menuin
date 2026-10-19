import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { eq, and } from 'drizzle-orm';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set!');
  process.exit(1);
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client, { schema });

async function seedVerification() {
  console.log('🌱 Starting idempotent verification seed...');

  try {
    // 1. Get an existing account or create a reference
    const accounts = await db.select().from(schema.accounts).limit(1);
    if (accounts.length === 0) {
      console.log('⚠️ No existing accounts found, skipping seed-verification');
      return;
    }
    const mainAccount = accounts[0];

    // 2. Seed Business Profile 1: PT Kopi Nusantara Prima (Corporate / PT)
    let [bp1] = await db
      .select()
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.name, 'PT Kopi Nusantara Prima'))
      .limit(1);

    if (!bp1) {
      [bp1] = await db
        .insert(schema.businessProfiles)
        .values({
          accountId: mainAccount.id,
          name: 'PT Kopi Nusantara Prima',
          entityType: 'PT',
          taxId: '01.234.567.8-012.000',
          businessLicenseNumber: '9120001234567',
          responsiblePersonName: mainAccount.name || 'Direktur Utama',
          responsiblePersonNik: '3171012345670001',
          responsiblePersonContact: '081234567890',
          bankName: 'BCA',
          bankAccountNumber: '1234567890',
          bankAccountHolder: 'PT Kopi Nusantara Prima',
          verificationStatus: 'verified',
        })
        .returning();
      console.log('✅ Created Business Profile 1: PT Kopi Nusantara Prima (verified)');
    } else {
      console.log('ℹ️ Business Profile 1 already exists');
    }

    // 3. Seed Business Profile 2: Warung Kopi Sederhana (Individual / Perseorangan)
    let [bp2] = await db
      .select()
      .from(schema.businessProfiles)
      .where(eq(schema.businessProfiles.name, 'Warung Kopi Sederhana'))
      .limit(1);

    if (!bp2) {
      [bp2] = await db
        .insert(schema.businessProfiles)
        .values({
          accountId: mainAccount.id,
          name: 'Warung Kopi Sederhana',
          entityType: 'INDIVIDUAL',
          taxId: '98.765.432.1-098.000',
          businessLicenseNumber: null,
          responsiblePersonName: mainAccount.name || 'Pemilik Warung',
          responsiblePersonNik: '3171098765430002',
          responsiblePersonContact: '081987654321',
          bankName: 'MANDIRI',
          bankAccountNumber: '9876543210',
          bankAccountHolder: mainAccount.name || 'Pemilik Warung',
          verificationStatus: 'under_review',
        })
        .returning();
      console.log('✅ Created Business Profile 2: Warung Kopi Sederhana (under_review)');
    } else {
      console.log('ℹ️ Business Profile 2 already exists');
    }

    // 4. Link existing tenants to business profiles ONLY if owned by mainAccount
    const existingTenants = await db
      .select({
        id: schema.tenants.id,
        name: schema.tenants.name,
        businessProfileId: schema.tenants.businessProfileId,
      })
      .from(schema.tenants)
      .innerJoin(
        schema.memberships,
        and(
          eq(schema.memberships.tenantId, schema.tenants.id),
          eq(schema.memberships.accountId, mainAccount.id),
          eq(schema.memberships.role, 'OWNER'),
          eq(schema.memberships.status, 'ACTIVE')
        )
      )
      .limit(3);

    if (existingTenants.length > 0) {
      const [t1, t2, t3] = existingTenants;

      if (t1 && !t1.businessProfileId) {
        await db
          .update(schema.tenants)
          .set({
            businessProfileId: bp1.id,
            postalCode: '12190',
            latitude: '-6.22410000',
            longitude: '106.80980000',
            outletComplianceStatus: 'verified',
          })
          .where(eq(schema.tenants.id, t1.id));
        console.log(`✅ Linked owner tenant ${t1.name} to BP1 (${bp1.name}) as verified`);
      }

      if (t2 && !t2.businessProfileId) {
        await db
          .update(schema.tenants)
          .set({
            businessProfileId: bp1.id,
            postalCode: '40115',
            latitude: '-6.91750000',
            longitude: '107.61910000',
            outletComplianceStatus: 'ready_for_review',
          })
          .where(eq(schema.tenants.id, t2.id));
        console.log(`✅ Linked owner tenant ${t2.name} to BP1 (${bp1.name}) as ready_for_review`);
      }

      if (t3 && !t3.businessProfileId) {
        await db
          .update(schema.tenants)
          .set({
            businessProfileId: bp2.id,
            postalCode: '12810',
            latitude: '-6.23000000',
            longitude: '106.85000000',
            outletComplianceStatus: 'incomplete',
          })
          .where(eq(schema.tenants.id, t3.id));
        console.log(`✅ Linked owner tenant ${t3.name} to BP2 (${bp2.name}) as incomplete`);
      }
    }

    console.log('🎉 Verification seed completed successfully.');
  } catch (error) {
    console.error('❌ Error during verification seeding:', error);
  } finally {
    await client.end();
  }
}

seedVerification();
