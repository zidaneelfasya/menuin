/**
 * MENUIN — Standalone TypeScript Load Test Runner
 * 
 * Provides an immediate, zero-external-binary load testing execution tool
 * using native Node.js fetch and performance timers.
 * 
 * Features:
 * - Concurrently simulates the 4 MENUIN journeys
 * - Calculates p50, p90, p95, p99 latency percentiles
 * - Tracks HTTP throughput (RPS) and error rates
 * - Compares results against business SLA thresholds
 * 
 * Usage:
 *   npx tsx runner/run-load-test.ts --vus=10 --duration=30s --scenario=expected
 */

import testConfig from '../config/test-config.json';

interface MetricRecord {
  name: string;
  durationMs: number;
  success: boolean;
  statusCode: number;
}

const recordedMetrics: MetricRecord[] = [];
let isRunning = true;

const TARGET_BASE_URL = process.env.TARGET_BASE_URL || testConfig.targetBaseUrl;

function parseArgs() {
  const args = process.argv.slice(2);
  const vus = parseInt(args.find(a => a.startsWith('--vus='))?.split('=')[1] || '10', 10);
  const durationStr = args.find(a => a.startsWith('--duration='))?.split('=')[1] || '30s';
  const durationSeconds = parseInt(durationStr.replace('s', ''), 10) || 30;
  const scenario = args.find(a => a.startsWith('--scenario='))?.split('=')[1] || 'expected';

  return { vus, durationSeconds, scenario };
}

async function simulateStorefront(outlet: typeof testConfig.outlets[0]) {
  const table = outlet.tables[Math.floor(Math.random() * outlet.tables.length)];
  const t0 = performance.now();
  try {
    const res = await fetch(`${TARGET_BASE_URL}/store/${outlet.slug}?table=${table}`, {
      headers: { 'X-Simulated-Client': 'TS-LoadRunner' }
    });
    const duration = performance.now() - t0;
    recordedMetrics.push({
      name: 'storefront_qr_scan',
      durationMs: duration,
      success: res.ok,
      statusCode: res.status,
    });
  } catch (err) {
    recordedMetrics.push({
      name: 'storefront_qr_scan',
      durationMs: performance.now() - t0,
      success: false,
      statusCode: 0,
    });
  }
}

async function simulateCashier(outlet: typeof testConfig.outlets[0]) {
  const t0 = performance.now();
  try {
    // 1. PIN Login
    const loginRes = await fetch(`${TARGET_BASE_URL}/api/mobile/v1/auth/login-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: outlet.cashierUsername,
        pin: outlet.cashierPin,
        tenantId: outlet.id,
        deviceId: 'ts-runner-pos-01',
      })
    });

    const loginData = await loginRes.json().catch(() => ({}));
    const token = loginData.token;

    if (!token) {
      recordedMetrics.push({
        name: 'pos_checkout',
        durationMs: performance.now() - t0,
        success: false,
        statusCode: loginRes.status,
      });
      return;
    }

    // 2. Fast Checkout
    const checkStart = performance.now();
    const checkRes = await fetch(`${TARGET_BASE_URL}/api/mobile/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        paymentMethod: 'CASH',
        orderType: 'DINE_IN',
        tableNumber: '1',
        totalAmount: 45000,
        tax: 4500,
        serviceCharge: 2250,
        grandTotal: 51750,
        items: [{ productId: 'synthetic-prod-01', quantity: 1, price: 45000, subtotal: 45000 }]
      })
    });

    recordedMetrics.push({
      name: 'pos_checkout',
      durationMs: performance.now() - checkStart,
      success: checkRes.ok,
      statusCode: checkRes.status,
    });
  } catch (err) {
    recordedMetrics.push({
      name: 'pos_checkout',
      durationMs: performance.now() - t0,
      success: false,
      statusCode: 0,
    });
  }
}

async function simulateKds(outlet: typeof testConfig.outlets[0]) {
  const t0 = performance.now();
  try {
    // Fetch active orders
    const res = await fetch(`${TARGET_BASE_URL}/api/mobile/v1/orders`, {
      headers: { 'X-Simulated-Client': 'TS-Kds' }
    });
    recordedMetrics.push({
      name: 'kds_poll_orders',
      durationMs: performance.now() - t0,
      success: res.ok,
      statusCode: res.status,
    });
  } catch (err) {
    recordedMetrics.push({
      name: 'kds_poll_orders',
      durationMs: performance.now() - t0,
      success: false,
      statusCode: 0,
    });
  }
}

async function simulateOwner(outlet: typeof testConfig.outlets[0]) {
  const t0 = performance.now();
  try {
    const res = await fetch(`${TARGET_BASE_URL}/outlet/${outlet.outletKey}/dashboard`);
    recordedMetrics.push({
      name: 'owner_dashboard_ssr',
      durationMs: performance.now() - t0,
      success: res.status < 400 || res.status === 307 || res.status === 302,
      statusCode: res.status,
    });
  } catch (err) {
    recordedMetrics.push({
      name: 'owner_dashboard_ssr',
      durationMs: performance.now() - t0,
      success: false,
      statusCode: 0,
    });
  }
}

async function vuWorker(workerId: number) {
  while (isRunning) {
    const outlet = testConfig.outlets[workerId % testConfig.outlets.length];
    const rand = Math.random();

    // Workload distribution: 55% Storefront, 25% POS, 15% KDS, 5% Owner
    if (rand < 0.55) {
      await simulateStorefront(outlet);
    } else if (rand < 0.80) {
      await simulateCashier(outlet);
    } else if (rand < 0.95) {
      await simulateKds(outlet);
    } else {
      await simulateOwner(outlet);
    }

    // Inter-request pacing
    await new Promise(r => setTimeout(r, Math.random() * 500 + 200));
  }
}

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return Math.round(sorted[Math.max(0, index)]);
}

function printSummary(totalSeconds: number) {
  console.log('\n======================================================================');
  console.log('              MENUIN LOAD TEST EXECUTION RESULTS SUMMARY               ');
  console.log('======================================================================\n');

  const totalRequests = recordedMetrics.length;
  const failedRequests = recordedMetrics.filter(m => !m.success).length;
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
  const rps = (totalRequests / totalSeconds).toFixed(1);

  console.log(`⏱️  Duration:           ${totalSeconds}s`);
  console.log(`🚀 Total Requests:     ${totalRequests}`);
  console.log(`⚡ Throughput (RPS):   ${rps} req/sec`);
  console.log(`❌ Error Rate:         ${errorRate.toFixed(2)}% (${failedRequests} failed)\n`);

  console.log('----------------------------------------------------------------------');
  console.log('JOURNEY LATENCIES (ms)           COUNT    p50    p90    p95    p99    PASS/FAIL');
  console.log('----------------------------------------------------------------------');

  const journeyNames = ['storefront_qr_scan', 'pos_checkout', 'kds_poll_orders', 'owner_dashboard_ssr'];
  const thresholds: Record<string, number> = {
    storefront_qr_scan: 350,
    pos_checkout: 500,
    kds_poll_orders: 150,
    owner_dashboard_ssr: 1200,
  };

  for (const jName of journeyNames) {
    const list = recordedMetrics.filter(m => m.name === jName).map(m => m.durationMs);
    const count = list.length;
    const p50 = calculatePercentile(list, 50);
    const p90 = calculatePercentile(list, 90);
    const p95 = calculatePercentile(list, 95);
    const p99 = calculatePercentile(list, 99);
    const threshold = thresholds[jName] || 500;
    const passed = p95 <= threshold && count > 0;
    const passTag = count === 0 ? 'NO_DATA' : (passed ? '✅ PASS' : '❌ FAIL');

    console.log(
      `${jName.padEnd(30)} ${String(count).padStart(6)} ` +
      `${String(p50).padStart(6)} ${String(p90).padStart(6)} ${String(p95).padStart(6)} ${String(p99).padStart(6)}   ${passTag}`
    );
  }

  console.log('----------------------------------------------------------------------\n');
}

async function main() {
  const { vus, durationSeconds, scenario } = parseArgs();

  console.log('======================================================================');
  console.log('              MENUIN STANDALONE LOAD TEST HARNESS                    ');
  console.log('======================================================================');
  console.log(`🎯 Target URL:   ${TARGET_BASE_URL}`);
  console.log(`👥 Concurrency:  ${vus} Virtual Users (VUs)`);
  console.log(`⏱️  Duration:     ${durationSeconds} seconds`);
  console.log(`📋 Scenario:     ${scenario}`);
  console.log(`🏪 Outlets:      ${testConfig.outlets.length} synthetic multi-tenant outlets\n`);
  console.log('🚀 Launching workers. Press [Ctrl+C] to abort early...\n');

  const startTime = Date.now();
  const workers = Array.from({ length: vus }, (_, i) => vuWorker(i));

  setTimeout(() => {
    isRunning = false;
  }, durationSeconds * 1000);

  await Promise.all(workers);

  const totalElapsed = (Date.now() - startTime) / 1000;
  printSummary(totalElapsed);
}

main().catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
