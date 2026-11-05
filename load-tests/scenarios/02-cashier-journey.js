/**
 * MENUIN — Journey 2: Cashier POS Operations
 * 
 * Simulates high-speed point-of-sale checkout:
 * 1. PIN Login -> POST /api/mobile/v1/auth/login-pin
 * 2. Fetch POS Catalog -> GET /api/mobile/v1/pos
 * 3. Fast Atomic Checkout -> POST /api/mobile/v1/orders
 * 4. Verify Active Shift -> GET /api/mobile/v1/shifts
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const posCheckoutDuration = new Trend('pos_checkout_duration', true);
const posCatalogDuration = new Trend('pos_catalog_duration', true);
const posSuccessRate = new Rate('pos_success_rate');
const posTransactions = new Counter('pos_transactions_count');

const config = JSON.parse(open('../config/test-config.json'));
const BASE_URL = __ENV.TARGET_BASE_URL || config.targetBaseUrl;

export const options = {
  vus: 10,
  duration: '1m',
  thresholds: {
    pos_checkout_duration: ['p(95)<500'],
    pos_catalog_duration: ['p(95)<300'],
    pos_success_rate: ['rate>0.99'],
  },
};

export default function () {
  // Select an outlet
  const outlet = config.outlets[Math.floor(Math.random() * config.outlets.length)];

  // 1. Cashier Login with PIN
  const loginPayload = JSON.stringify({
    username: outlet.cashierUsername,
    pin: outlet.cashierPin,
    tenantId: outlet.id,
    deviceId: 'k6-pos-synthetic-terminal-01',
  });

  const loginRes = http.post(`${BASE_URL}/api/mobile/v1/auth/login-pin`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'Cashier_PIN_Login' },
  });

  let token = null;
  const loginOk = check(loginRes, {
    'cashier login 200': (r) => r.status === 200,
    'jwt token returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        token = body.token;
        return !!token;
      } catch (e) {
        return false;
      }
    },
  });

  if (!token) {
    posSuccessRate.add(false);
    sleep(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Fetch POS Catalog
  const catStart = Date.now();
  const catalogRes = http.get(`${BASE_URL}/api/mobile/v1/pos`, {
    headers: authHeaders,
    tags: { name: 'POS_Fetch_Catalog' },
  });
  posCatalogDuration.add(Date.now() - catStart);

  check(catalogRes, {
    'catalog fetch 200': (r) => r.status === 200,
  });

  // Short pause: Cashier assembling cart items
  sleep(Math.random() * 2 + 1);

  // 3. Fast Atomic Checkout (Cash transaction)
  const subtotal = 54000;
  const tax = Math.round(subtotal * 0.1);
  const service = Math.round(subtotal * 0.05);
  const grandTotal = subtotal + tax + service;

  const checkoutPayload = JSON.stringify({
    paymentMethod: 'CASH',
    orderType: 'DINE_IN',
    tableNumber: outlet.tables[Math.floor(Math.random() * outlet.tables.length)],
    totalAmount: subtotal,
    tax: tax,
    serviceCharge: service,
    grandTotal: grandTotal,
    items: [
      {
        productId: 'synthetic-prod-01',
        quantity: 1,
        price: 28000,
        subtotal: 28000,
        notes: 'Bungkus terpisah',
      },
      {
        productId: 'synthetic-prod-02',
        quantity: 1,
        price: 26000,
        subtotal: 26000,
      }
    ]
  });

  const checkStart = Date.now();
  const checkoutRes = http.post(`${BASE_URL}/api/mobile/v1/orders`, checkoutPayload, {
    headers: authHeaders,
    tags: { name: 'POS_Atomic_Checkout' },
  });
  posCheckoutDuration.add(Date.now() - checkStart);

  const checkOk = check(checkoutRes, {
    'checkout 200': (r) => r.status === 200 || r.status === 201,
  });

  posSuccessRate.add(checkOk);
  if (checkOk) {
    posTransactions.add(1);
  }

  // 4. Shift Heartbeat Query
  const shiftRes = http.get(`${BASE_URL}/api/mobile/v1/shifts`, {
    headers: authHeaders,
    tags: { name: 'POS_Verify_Shift' },
  });
  check(shiftRes, {
    'shift check 200': (r) => r.status === 200,
  });

  sleep(2);
}
