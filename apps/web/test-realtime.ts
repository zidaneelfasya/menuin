import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { db } from './src/lib/db/index';
import { transactions, tenants } from './src/lib/db/schema';
import { eq } from 'drizzle-orm';

async function run() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
  console.log('Connecting with key:', key);
  
  const supabase = createClient(url, key);

  supabase
    .channel('test-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, (payload) => {
      console.log('REALTIME EVENT RECEIVED:', payload.eventType, (payload.new as any)?.status);
    })
    .subscribe(async (status) => {
      console.log('Subscription status:', status);
      
      if (status === 'SUBSCRIBED') {
        console.log('Inserting test transaction...');
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
        
        setTimeout(() => {
          console.log('Test finished.');
          process.exit(0);
        }, 3000);
      }
      
      if (status === 'CHANNEL_ERROR') {
        console.error('Failed to subscribe.');
        process.exit(1);
      }
    });
}

run();
