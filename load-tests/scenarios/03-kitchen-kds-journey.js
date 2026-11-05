/**
 * MENUIN — Journey 3: Kitchen Display System (KDS)
 * 
 * Simulates kitchen tablet display behavior:
 * 1. Login with Staff PIN -> POST /api/mobile/v1/auth/login-pin
 * 2. Poll Active Orders Queue -> GET /api/mobile/v1/orders
 * 3. Update Order Status -> PATCH /api/mobile/v1/orders/${id}/status ("PROCESSING" -> "READY")
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const kdsPollDuration = new Trend('kds_poll_duration', true);
const kdsStatusDuration = new Trend('kds_status_duration', true);
const kdsSuccessRate = new Rate('kds_success_rate');
const ordersPrepared = new Counter('orders_prepared_count');

const config = JSON.parse(open('../config/test-config.json'));
const BASE_URL = __ENV.TARGET_BASE_URL || config.targetBaseUrl;

export const options = {
  vus: 5,
  duration: '1m',
  thresholds: {
    kds_poll_duration: ['p(95)<150'],
    kds_status_duration: ['p(95)<300'],
    kds_success_rate: ['rate>0.99'],
  },
};

export default function () {
  const outlet = config.outlets[Math.floor(Math.random() * config.outlets.length)];

  // 1. PIN Login
  const loginPayload = JSON.stringify({
    username: outlet.cashierUsername,
    pin: outlet.cashierPin,
    tenantId: outlet.id,
    deviceId: 'k6-kds-synthetic-display-01',
  });

  const loginRes = http.post(`${BASE_URL}/api/mobile/v1/auth/login-pin`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
    tags: { name: 'KDS_PIN_Login' },
  });

  let token = null;
  try {
    token = JSON.parse(loginRes.body).token;
  } catch (e) {
    kdsSuccessRate.add(false);
    sleep(1);
    return;
  }

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  // 2. Poll Active Orders Queue
  const pollStart = Date.now();
  const ordersRes = http.get(`${BASE_URL}/api/mobile/v1/orders`, {
    headers: authHeaders,
    tags: { name: 'KDS_Poll_Active_Orders' },
  });
  kdsPollDuration.add(Date.now() - pollStart);

  let activeOrders = [];
  const pollOk = check(ordersRes, {
    'kds poll 200': (r) => r.status === 200,
    'orders array returned': (r) => {
      try {
        const body = JSON.parse(r.body);
        activeOrders = body.data || [];
        return Array.isArray(activeOrders);
      } catch (e) {
        return false;
      }
    },
  });

  kdsSuccessRate.add(pollOk);

  // 3. If there are active orders, progress the first one
  if (activeOrders.length > 0) {
    const targetOrder = activeOrders[0];

    // Transition to PROCESSING
    const patchStart = Date.now();
    const processRes = http.patch(
      `${BASE_URL}/api/mobile/v1/orders/${targetOrder.id}/status`,
      JSON.stringify({ status: 'PROCESSING' }),
      {
        headers: authHeaders,
        tags: { name: 'KDS_Mark_Processing' },
      }
    );
    kdsStatusDuration.add(Date.now() - patchStart);

    check(processRes, {
      'status updated to processing': (r) => r.status === 200,
    });

    // Cooking preparation simulation
    sleep(Math.random() * 3 + 2);

    // Transition to READY
    const readyRes = http.patch(
      `${BASE_URL}/api/mobile/v1/orders/${targetOrder.id}/status`,
      JSON.stringify({ status: 'READY' }),
      {
        headers: authHeaders,
        tags: { name: 'KDS_Mark_Ready' },
      }
    );

    const readyOk = check(readyRes, {
      'status updated to ready': (r) => r.status === 200,
    });

    if (readyOk) {
      ordersPrepared.add(1);
    }
  }

  // Periodic polling interval
  sleep(5);
}
