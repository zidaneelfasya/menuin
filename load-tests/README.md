# MENUIN — Staging Load Testing Suite

This directory contains the production-grade load testing implementation for the **MENUIN** multi-tenant restaurant platform, built based on the architectural findings of [`docs/infrastructure/menuin-capacity-audit.md`](file:///home/zidaneelfasya/D/Github/menuin/docs/infrastructure/menuin-capacity-audit.md) and [`docs/infrastructure/staging-load-test-plan.md`](file:///home/zidaneelfasya/D/Github/menuin/docs/infrastructure/staging-load-test-plan.md).

---

## 📁 Directory Layout

```
load-tests/
├── README.md                           # This guide
├── package.json                        # Scripts and runner commands
├── config/
│   └── test-config.json                # Target URL, 10 synthetic outlets, SLA thresholds
├── scripts/
│   ├── seed-staging-data.ts            # Provisions 10 synthetic outlets, shifts, products, and historical data
│   ├── cleanup-staging-data.ts         # Safely tears down all synthetic data (slug LIKE 'stg-outlet-%')
│   └── mock-doku-webhook.ts            # Local HMAC payment gateway simulation
├── monitoring/
│   └── monitor-vps-resources.sh        # Telemetry logger for CPU, RAM, PostgreSQL connections
├── scenarios/
│   ├── 01-storefront-journey.js        # k6: Customer QR ordering & status polling (55%)
│   ├── 02-cashier-journey.js           # k6: Cashier PIN login & atomic POS checkout (25%)
│   ├── 03-kitchen-kds-journey.js       # k6: Kitchen display polling & status updates (15%)
│   ├── 04-owner-dashboard-journey.js   # k6: Owner dashboard & 30-day reporting (5%)
│   └── 05-combined-rush-workload.js    # k6 master script: Full multi-tenant restaurant rush
└── runner/
    └── run-load-test.ts                # Standalone TypeScript runner (dependency-free)
```

---

## 🛡️ Safety & Non-Destructive Guarantees

1. **Target Isolation:** Only executes against the URL defined in `TARGET_BASE_URL` (default: `http://localhost:3000`). Never run against production domains (`menuin.id`).
2. **Payment Mocking:** No real payments or credit cards are touched. DOKU webhooks are authenticated via HMAC SHA256 simulation in `mock-doku-webhook.ts`.
3. **Data Sandboxing:** All synthetic records are strictly isolated with the slug prefix `stg-outlet-XX`. The cleanup script will **never** delete any record outside this synthetic namespace.

---

## 🚀 Execution Instructions

### Step 1: Provision Synthetic Staging Data
```bash
cd load-tests
npm run seed
```
*Provisions 10 synthetic restaurant outlets, 250 products, 40 categories, active cashier shifts, and 500 historical seed transactions.*

### Step 2: Start Background Resource Telemetry (Optional)
In a separate terminal:
```bash
npm run monitor
```
*Logs system CPU, RAM, Node.js memory, and PostgreSQL connection pool counts at 1-second intervals to `results/vps_telemetry_*.csv`.*

### Step 3: Run the Load Test Scenarios

#### Option A: Using Grafana k6 (Primary Engine)
```bash
# 1. Sanity Smoke Test (10 VUs, 2m)
npm run k6:smoke

# 2. Expected Operational Load (50 VUs, 10m)
npm run k6:expected

# 3. Peak Rush Hour Spike (150 VUs, 15m)
npm run k6:peak

# 4. Soak / Endurance Test (40 VUs, 60m)
npm run k6:soak
```

#### Option B: Using Standalone TypeScript Runner (Zero-Binary Alternative)
If `k6` binary is not installed on the staging host, run directly with Node.js / `tsx`:
```bash
# Run 10 VUs for 30 seconds
npm run test:runner -- --vus=10 --duration=30s --scenario=expected

# Run 50 VUs for 60 seconds
npm run test:runner -- --vus=50 --duration=60s --scenario=peak
```

### Step 4: Teardown & Clean Synthetic Staging Data
```bash
npm run cleanup
```
*Atomically removes all test outlets, transactions, items, shifts, and synthetic accounts.*
