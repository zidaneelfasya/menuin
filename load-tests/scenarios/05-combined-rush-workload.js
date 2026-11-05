/**
 * MENUIN — Master Blended Rush Hour Workload Simulation
 * 
 * Accurately models a multi-tenant F&B ecosystem with concurrent:
 * - Customers scanning QR & placing orders (55%)
 * - Cashiers checking out orders via POS (25%)
 * - Kitchen displays updating preparation statuses (15%)
 * - Owners checking metrics & sales reports (5%)
 * 
 * Supports 4 execution profiles via -e SCENARIO=<name>:
 *   smoke    : 10 VUs for 2 minutes (Sanity check)
 *   expected : 50 VUs for 10 minutes (Normal operational day)
 *   peak     : 150 VUs for 15 minutes (Lunch rush spike)
 *   soak     : 40 VUs for 60 minutes (Memory leak / connection endurance)
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

// Import individual journey handlers
import storefrontScenario from './01-storefront-journey.js';
import cashierScenario from './02-cashier-journey.js';
import kitchenScenario from './03-kitchen-kds-journey.js';
import ownerScenario from './04-owner-dashboard-journey.js';

const config = JSON.parse(open('../config/test-config.json'));
const SELECTED_PROFILE = __ENV.SCENARIO || 'expected';

// -----------------------------------------------------------------------------
// Stage Configurations
// -----------------------------------------------------------------------------
function getStages(profile) {
  switch (profile) {
    case 'smoke':
      return [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ];
    case 'peak':
      return [
        { duration: '2m', target: 50 },
        { duration: '5m', target: 150 }, // Lunch rush spike
        { duration: '5m', target: 150 },
        { duration: '3m', target: 0 },
      ];
    case 'soak':
      return [
        { duration: '2m', target: 40 },
        { duration: '56m', target: 40 }, // Sustained endurance
        { duration: '2m', target: 0 },
      ];
    case 'expected':
    default:
      return [
        { duration: '2m', target: 20 },
        { duration: '6m', target: 50 }, // Standard operating hours
        { duration: '2m', target: 0 },
      ];
  }
}

const activeStages = getStages(SELECTED_PROFILE);

export const options = {
  scenarios: {
    // 1. Customer Storefront (55% weight)
    storefront_traffic: {
      executor: 'ramping-vus',
      stages: activeStages.map(s => ({ ...s, target: Math.round(s.target * 0.55) })),
      exec: 'runStorefront',
    },
    // 2. Cashier POS Checkout (25% weight)
    cashier_traffic: {
      executor: 'ramping-vus',
      stages: activeStages.map(s => ({ ...s, target: Math.max(1, Math.round(s.target * 0.25)) })),
      exec: 'runCashier',
    },
    // 3. Kitchen Display (15% weight)
    kitchen_traffic: {
      executor: 'ramping-vus',
      stages: activeStages.map(s => ({ ...s, target: Math.max(1, Math.round(s.target * 0.15)) })),
      exec: 'runKitchen',
    },
    // 4. Owner Dashboard & Analytics (5% weight)
    owner_traffic: {
      executor: 'ramping-vus',
      stages: activeStages.map(s => ({ ...s, target: Math.max(1, Math.round(s.target * 0.05)) })),
      exec: 'runOwner',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.005'], // < 0.5% failure
    http_req_duration: ['p(95)<450', 'p(99)<1000'],
    storefront_duration: ['p(95)<350'],
    pos_checkout_duration: ['p(95)<500'],
    kds_poll_duration: ['p(95)<150'],
    owner_dashboard_duration: ['p(95)<1200'],
  },
};

export function runStorefront() {
  storefrontScenario();
}

export function runCashier() {
  cashierScenario();
}

export function runKitchen() {
  kitchenScenario();
}

export function runOwner() {
  ownerScenario();
}

export default function () {
  // Default fallback
  storefrontScenario();
}
