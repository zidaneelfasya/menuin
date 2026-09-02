import { createOnlineOrder } from './src/lib/actions/public-catalog';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
  console.log("Testing createOnlineOrder...");
  const result = await createOnlineOrder({
    tenantSlug: 'kopi-kenangan',
    orderType: 'DINE_IN',
    items: [{
      id: 'some-valid-product-id-here',
      quantity: 1
    }],
    paymentMethod: 'ONLINE',
  });
  console.log("Result:", result);
}
test().catch(console.error);
