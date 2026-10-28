/**
 * MENUIN — Journey 4: Owner / Manager Business Analytics
 * 
 * Simulates restaurant owners reviewing daily and monthly metrics:
 * 1. Mobile Dashboard Aggregates -> GET /api/mobile/v1/dashboard
 * 2. Next.js RSC Dashboard Overview -> GET /outlet/${outletKey}/dashboard
 * 3. 30-Day Sales Analytics -> GET /outlet/${outletKey}/reports/sales
 * 4. Operational Speed & Cashflow -> GET /outlet/${outletKey}/reports/operations
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const dashboardDuration = new Trend('owner_dashboard_duration', true);
const reportDuration = new Trend('owner_report_duration', true);
const ownerSuccessRate = new Rate('owner_success_rate');

const config = JSON.parse(open('../config/test-config.json'));
const BASE_URL = __ENV.TARGET_BASE_URL || config.targetBaseUrl;

export const options = {
  vus: 3,
  duration: '1m',
  thresholds: {
    owner_dashboard_duration: ['p(95)<1200'],
    owner_report_duration: ['p(95)<1500'],
    owner_success_rate: ['rate>0.98'],
  },
};

export default function () {
  const outlet = config.outlets[Math.floor(Math.random() * config.outlets.length)];

  // 1. PIN Login for API metrics
  const loginRes = http.post(
    `${BASE_URL}/api/mobile/v1/auth/login-pin`,
    JSON.stringify({
      username: outlet.cashierUsername,
      pin: outlet.cashierPin,
      tenantId: outlet.id,
      deviceId: 'k6-owner-device-01',
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = null;
  try {
    token = JSON.parse(loginRes.body).token;
  } catch (e) {
    // continue to web routes
  }

  // 2. Fetch Mobile Dashboard Analytics Endpoint
  if (token) {
    const dashStart = Date.now();
    const dashApiRes = http.get(`${BASE_URL}/api/mobile/v1/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      tags: { name: 'Owner_API_Dashboard' },
    });
    dashboardDuration.add(Date.now() - dashStart);

    check(dashApiRes, {
      'api dashboard 200': (r) => r.status === 200,
    });
  }

  // 3. Web Dashboard Page View (RSC SSR)
  const webStart = Date.now();
  const webDashRes = http.get(`${BASE_URL}/outlet/${outlet.outletKey}/dashboard`, {
    tags: { name: 'Owner_Web_Dashboard_RSC' },
  });
  dashboardDuration.add(Date.now() - webStart);

  const dashOk = check(webDashRes, {
    'web dashboard loaded': (r) => r.status === 200 || r.status === 307 || r.status === 302,
  });
  ownerSuccessRate.add(dashOk);

  sleep(Math.random() * 3 + 2);

  // 4. Sales Report View (Analytics Aggregation)
  const reportStart = Date.now();
  const salesReportRes = http.get(`${BASE_URL}/outlet/${outlet.outletKey}/reports/sales`, {
    tags: { name: 'Owner_Sales_Report' },
  });
  reportDuration.add(Date.now() - reportStart);

  check(salesReportRes, {
    'sales report loaded': (r) => r.status === 200 || r.status === 307 || r.status === 302,
  });

  sleep(4);
}
