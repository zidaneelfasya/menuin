import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from './src/lib/db/index';
import { transactions, tenants } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  const supabase = createClient(url, key);

  supabase
    .channel('test-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
      console.log('REALTIME EVENT RECEIVED PAYLOAD NEW:', payload.new);
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const tResult = await db.select().from(tenants).limit(1);
        const tenantId = tResult[0].id;
        await db.insert(transactions).values({
          tenantId,
          totalAmount: '100',
          grandTotal: '100',
          paymentMethod: 'CASH',
          paymentStatus: 'PENDING',
          status: 'PENDING',
          orderType: 'DINE_IN'
        });
        setTimeout(() => process.exit(0), 2000);
      }
    });
}

run();
