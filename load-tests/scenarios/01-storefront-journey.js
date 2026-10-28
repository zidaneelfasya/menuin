/**
 * MENUIN — Journey 1: Customer Storefront (QR Self-Order)
 * 
 * Simulates a customer arriving at a restaurant table:
 * 1. Scans QR code -> GET /store/${slug}?table=${table}
 * 2. Browses menu (think time: 3-8s)
 * 3. Submits self-order -> POST /api/mobile/v1/orders
 * 4. Polls status every 10 seconds -> GET /store/${slug}/status?order=${orderNumber}
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const storefrontDuration = new Trend('storefront_duration', true);
const storefrontSuccess = new Rate('storefront_success_rate');
const ordersCreated = new Counter('orders_created_count');

const config = JSON.parse(open('../config/test-config.json'));
const BASE_URL = __ENV.TARGET_BASE_URL || config.targetBaseUrl;

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    storefront_duration: ['p(95)<350'],
    storefront_success_rate: ['rate>0.99'],
  },
};

export default function () {
  // Randomly pick one of the 10 synthetic outlets
  const outlet = config.outlets[Math.floor(Math.random() * config.outlets.length)];
  const table = outlet.tables[Math.floor(Math.random() * outlet.tables.length)];

  // 1. Visit Storefront via QR scan
  const startStorefront = Date.now();
  const storeRes = http.get(`${BASE_URL}/store/${outlet.slug}?table=${table}`, {
    tags: { name: 'Storefront_QR_Scan' },
  });

  storefrontDuration.add(Date.now() - startStorefront);
  const storeOk = check(storeRes, {
    'storefront loaded 200': (r) => r.status === 200,
    'menu rendered in HTML': (r) => r.body && r.body.length > 500,
  });
  storefrontSuccess.add(storeOk);

  // Think time: customer browsing categories & choosing items
  sleep(Math.random() * 4 + 2);

  // 2. Submit Self-Order (Payload matching createOnlineOrder schema)
  const orderPayload = JSON.stringify({
    tenantSlug: outlet.slug,
    orderType: 'DINE_IN',
    customerName: `Customer ${__VU}-${__ITER}`,
    customerPhone: '081234567890',
    tableNumber: table,
    paymentMethod: 'ONLINE',
    items: [
      {
        id: 'synthetic-prod-01',
        quantity: 2,
        notes: 'Less ice, pedas sedang',
        modifiers: []
      }
    ]
  });

  const orderRes = http.post(`${BASE_URL}/api/mobile/v1/orders`, orderPayload, {
    headers: {
      'Content-Type': 'application/json',
      'X-Simulated-Client': 'Storefront-K6',
    },
    tags: { name: 'Customer_Submit_Order' },
  });

  check(orderRes, {
    'order accepted': (r) => r.status === 200 || r.status === 201,
  });

  let orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
  try {
    const body = JSON.parse(orderRes.body);
    if (body.data?.orderNumber) {
      orderNumber = body.data.orderNumber;
    }
  } catch (e) {
    // Fallback order number
  }

  ordersCreated.add(1);

  // 3. Status Polling (simulates customer waiting at table, 2 polls)
  sleep(3);
  const statusRes1 = http.get(`${BASE_URL}/store/${outlet.slug}/status?order=${encodeURIComponent(orderNumber)}`, {
    tags: { name: 'Customer_Poll_Status' },
  });
  check(statusRes1, {
    'status poll 1 ok': (r) => r.status === 200,
  });

  sleep(4);
  const statusRes2 = http.get(`${BASE_URL}/store/${outlet.slug}/status?order=${encodeURIComponent(orderNumber)}`, {
    tags: { name: 'Customer_Poll_Status' },
  });
  check(statusRes2, {
    'status poll 2 ok': (r) => r.status === 200,
  });

  sleep(1);
}
