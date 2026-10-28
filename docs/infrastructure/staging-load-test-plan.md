# MENUIN — Staging Load Testing Specification & Implementation Plan

> **Document Type:** Production-Grade Staging Load-Test Plan & Verification Blueprint  
> **Target Application:** MENUIN Multi-Tenant Restaurant POS & QR Ordering Platform  
> **Status:** Plan Ready for Review (Execution Pending Approval)  
> **Base Reference:** [`docs/infrastructure/menuin-capacity-audit.md`](file:///home/zidaneelfasya/D/Github/menuin/docs/infrastructure/menuin-capacity-audit.md)  
> **Date:** 27 October 2026  
> **Execution Location:** Isolated Staging Environment (`load-tests/`)

---

## 1. Executive Summary & Safety Mandates

This test plan defines the formal protocol, workload models, synthetic dataset generation, and instrumentation required to stress-test the **MENUIN** application stack under realistic multi-tenant restaurant conditions.

### Strict Safety & Non-Destructive Principles:
1. **Zero Production Contamination:** Tests execute strictly against an isolated staging environment (`TARGET_BASE_URL` pointing to staging or local staging container).
2. **Zero Real Payments:** Payment gateway responses (DOKU / SNAP QRIS) are strictly simulated via a local HMAC-verified mock server (`load-tests/scripts/mock-doku-webhook.ts`). No live DOKU credentials or live bank transactions are touched.
3. **Zero Customer Communications:** Transactional email triggers (Resend) and SMS notifications are suppressed or routed to a dead-letter mock sink.
4. **Synthetic Data Isolation:** All generated tenants, products, shifts, and transactions are strictly tagged with the prefix `[STAGING_SYNTHETIC]` and tenant slugs formatted as `stg-outlet-XX`. A dedicated cleanup script (`load-tests/scripts/cleanup-staging-data.ts`) ensures complete atomic teardown without touching legitimate customer records.
5. **No Blind Pass Claims:** No performance claims are accepted until tests have been physically executed and telemetry logs reviewed.

---

## 2. Tooling Selection & Stack Rationale

### Evaluated Testing Frameworks

| Tool | Pros | Cons | Verdict for MENUIN |
|---|---|---|---|
| **Grafana k6** (Go Engine) | • Native VU concurrency with zero Node.js event-loop contention.<br>• Rich percentile reporting (p50, p90, p95, p99).<br>• Supports multi-stage ramping and mixed traffic scenarios.<br>• Clean JavaScript/TypeScript test scripts.<br>• Threshold failure detection built-in. | Requires binary installation on host machine. | **PRIMARY RECOMMENDED ENGINE** |
| **Autocannon** (Node.js) | • Fast HTTP benchmarking.<br>• Pure Node.js ecosystem. | • Difficult to model complex, stateful multi-step user journeys (e.g. login $\rightarrow$ get JWT $\rightarrow$ open shift $\rightarrow$ cart $\rightarrow$ checkout $\rightarrow$ KDS poll).<br>• Node.js runner competes for event-loop resources under high VU counts. | Secondary (Micro-benchmarking only) |
| **Custom TypeScript Runner (`fetch` + `tsx`)** | • 100% dependency-free within existing repo (`tsx` already installed).<br>• Directly imports Drizzle ORM models for synthetic seeding.<br>• Can execute end-to-end journey tests even if `k6` binary is not installed on the system. | High concurrency ($> 1,000\text{ RPS}$) requires careful worker process management. | **INCLUDED COMPLEMENTARY RUNNER** |

### Selected Architecture: Hybrid k6 + TypeScript Harness
- **Test Orchestration & Concurrency Engine:** **Grafana k6** with ES6 scenario scripts located in `load-tests/scenarios/`.
- **Synthetic Data Generation & Cleanup:** Native **TypeScript + Drizzle ORM** scripts in `load-tests/scripts/`.
- **Mock Payment Webhook Dispatcher:** Native Node.js script using `crypto` for authentic DOKU HMAC-SHA256 signature generation.
- **Resource Telemetry Monitor:** Bash script capturing Linux OS CPU, RAM, PostgreSQL `pg_stat_activity`, and disk I/O at 1-second intervals.

---

## 3. Realistic User Journey Inventory & Traffic Modeling

Rather than hitting arbitrary HTTP endpoints, tests accurately simulate the 4 distinct human roles in an active Indonesian F&B establishment:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MENUIN REALISTIC TRAFFIC MIX                              │
├─────────────────────────┬─────────────────────────┬───────────────────┬────────────────┤
│ 1. Customer Storefront  │    2. Cashier POS       │ 3. Kitchen (KDS)  │ 4. Owner Admin │
│      (55% Volume)       │      (25% Volume)       │   (15% Volume)    │  (5% Volume)   │
├─────────────────────────┼─────────────────────────┼───────────────────┼────────────────┤
│ • Scan QR / View Menu   │ • PIN Login (JWT)       │ • Active Orders   │ • Dashboard    │
│ • Select Category/Item  │ • View POS Catalog      │   Poll (every 10s)│   Overview SSR │
│ • Submit Self-Order     │ • Create Cart + Items   │ • Mark Processing │ • 30-Day Sales │
│ • Poll Order Status     │ • Cash / QRIS Checkout  │ • Mark Ready      │   Report       │
│   (every 10s–15s)       │ • Stock Auto-Decrement  │ • Bump Order      │ • Finance Flow │
└─────────────────────────┴─────────────────────────┴───────────────────┴────────────────┘
```

### Journey 1: Customer Storefront (QR Self-Order) — 55% Traffic Mix
1. **Menu Discovery:** `GET /store/${tenantSlug}?table=${tableNumber}`
   - Exercises dynamic SSR, catalog querying, and the `transaction_items` top-seller query.
2. **Item Consideration:** Think time (5s – 12s sleep in browser).
3. **Order Submission:** `POST /api/mobile/v1/orders` (or Server Action `createOnlineOrder`)
   - Validates active shift, checks product inventory, calculates tax/service/rounding, inserts transaction in `PENDING` state with unique queue number.
4. **Order Status Polling:** `GET /store/${tenantSlug}/status?order=${orderNumber}`
   - Simulates customer waiting at the table, polling order progress every 10–15 seconds.

### Journey 2: Cashier POS Operations — 25% Traffic Mix
1. **Shift Initialization & Login:** `POST /api/mobile/v1/auth/login-pin`
   - Validates staff PIN against bcrypt hash, issues stateless JWT token.
2. **Catalog Pre-Load:** `GET /api/mobile/v1/pos`
   - Fetches all active categories, products, modifier groups, and current active shift ID.
3. **Order Assembly & Fast Checkout:** `POST /api/mobile/v1/orders` (POS checkout payload)
   - Atomic database transaction inserting transaction, transaction items, queue sequence generation, and immediate stock decrement (`UPDATE products SET stock = stock - qty`).

### Journey 3: Kitchen Display System (KDS) — 15% Traffic Mix
1. **Active Queue Polling / Fetch:** `GET /api/mobile/v1/orders`
   - Fetches active orders (`NEW`, `PENDING`, `PROCESSING`, `READY`) with order items and modifiers.
2. **Status Progression:**
   - `PATCH /api/mobile/v1/orders/${id}/status` $\rightarrow$ `status: "PROCESSING"`
   - Think time (preparation time: 10s – 30s).
   - `PATCH /api/mobile/v1/orders/${id}/status` $\rightarrow$ `status: "READY"`
   - `PATCH /api/mobile/v1/orders/${id}/status` $\rightarrow$ `status: "COMPLETED"`

### Journey 4: Owner / Manager Business Analytics — 5% Traffic Mix
1. **Manager Dashboard:** `GET /outlet/${outletKey}/dashboard` (RSC SSR)
   - Executes 14 parallel analytical queries (today's revenue, net sales, transaction count, active shift metrics).
2. **Sales Analytics:** `GET /outlet/${outletKey}/reports/sales?period=30days`
   - Heavy query joining transactions, items, categories, and promotions.
3. **Financial Cashflow:** `GET /outlet/${outletKey}/reports/finance?period=this_month`
   - Computes gross profit, operating expenses, and cash movement variance.

---

## 4. Test Scenarios & Multi-Stage Schedule

```
Virtual Users (VU)
   ▲
150│                                    ┌──────────────────────┐ (Phase 3: Peak Rush Hour)
   │                                    │                      │
 50│                     ┌──────────────┘                      └──────────────┐
   │                     │ (Phase 2: Expected Base Load)                      │
 10│      ┌──────────────┘                                                    └──────────────┐ (Phase 4: Soak)
   │      │ (Phase 1: Smoke/Baseline)                                                        │
  0└──────┴──────────────┴──────────────┴──────────────────────┴──────────────┴──────────────┴──────► Time
          0m             3m            10m                    25m            35m            95m
```

| Phase | Target Outlets | Virtual Users (VU) | Duration | Description & Objectives |
|---|---:|---:|---|---|
| **Phase 1: Baseline / Smoke Test** | 2 Outlets | 5–10 VUs | 3 minutes | Verify all 4 user journeys execute with 0% error rate; ensure mock webhooks and synthetic logins work seamlessly. |
| **Phase 2: Expected Base Load** | 10 Outlets | 30–50 VUs | 10 minutes | Simulate normal daily operational traffic across 10 active outlets (cashiers processing orders, customers scanning QR, kitchen preparing). |
| **Phase 3: Peak Rush Hour Spike** | 25 Outlets | 100–150 VUs | 15 minutes | Simulate simultaneous lunch rush (12:00–13:30) with 3.5x traffic concentration. Tests database connection pool saturation, lock contention, and queue generation latency. |
| **Phase 4: Soak / Endurance Test** | 10 Outlets | 40 VUs | 60 minutes | Continuous steady-state load to identify memory leaks in Node.js heap, unclosed PostgreSQL connection handles, and disk WAL accumulation. |

---

## 5. Synthetic Staging Dataset Specification

To ensure realistic performance without touching production data, the seeder creates:

- **10 Synthetic Outlets:**
  - Slugs: `stg-kopi-kenangan-01`, `stg-warung-padang-02`, ..., `stg-burger-joint-10`
  - Name prefix: `[STAGING] ...`
  - Tax Rate: 10%, Service Charge: 5%, Rounding: Active
- **Each Outlet Includes:**
  - 1 Active Shift (initial cash: Rp 500,000)
  - 2 Cashier Accounts (PIN: `123456`, Email: `cashier1@stg-outletX.menuin.id`)
  - 1 Kitchen Display Account (PIN: `123456`, Email: `kitchen@stg-outletX.menuin.id`)
  - 1 Owner Account (Email: `owner@stg-outletX.menuin.id`)
  - 5 Tables (`Meja 1` to `Meja 5`)
  - 4 Categories (`Makanan Utama`, `Minuman`, `Snack`, `Topping & Tambahan`)
  - 25 Products with realistic price points (Rp 18,000 – Rp 65,000) and tracked stock (100 units each)
  - 3 Modifier Groups (`Pilihan Level Pedas`, `Ukuran Minuman`, `Extra Topping`)
  - 50 Historical Seed Transactions per outlet (to populate historical charts and prevent zero-state cold scans).

---

## 6. Telemetry & Metric Instrumentation

During test execution, telemetry is captured from three distinct vantage points:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      TELEMETRY CAPTURE MATRIX                          │
├─────────────────────┬──────────────────────────┬───────────────────────┤
│  1. Client / k6     │    2. Node.js Runtime    │ 3. PostgreSQL Engine  │
├─────────────────────┼──────────────────────────┼───────────────────────┤
│ • HTTP RPS          │ • Process CPU %          │ • Active Connections  │
│ • p50, p90, p95, p99│ • Heap Used / Total (MB) │ • Idle in Transaction │
│   Latency per flow  │ • Event Loop Lag (ms)    │ • Lock Wait Count     │
│ • HTTP Error Rate % │ • Active Socket Count    │ • Disk WAL Write Rate │
│ • Failed Requests   │ • RSS Memory Footprint   │ • Slow Queries (>50ms)│
└─────────────────────┴──────────────────────────┴───────────────────────┘
```

The script `load-tests/monitoring/monitor-vps-resources.sh` continuously polls:
- `ps -aux` for CPU/RAM usage of Node.js and PostgreSQL.
- `pg_stat_activity` for connection states (`active`, `idle`, `idle in transaction`).
- `pg_locks` for lock contention and blocked queries.
- `pg_stat_database` for transaction commit rate and rollbacks.

---

## 7. Pass / Fail Criteria (Business SLAs)

Based on the operational reality of restaurant point-of-sale systems:

| Metric | Target SLA | Hard Failure Threshold | Rationale |
|---|---|---|---|
| **Overall HTTP Success Rate** | $\ge 99.9\%$ | $< 99.0\%$ | Failed orders lose revenue and stall store operations. |
| **POS Checkout Latency (p95)** | $\le 450\text{ ms}$ | $> 1,000\text{ ms}$ | Cashiers cannot wait longer than 1s during a long queue. |
| **Storefront QR Menu SSR (p95)**| $\le 350\text{ ms}$ | $> 800\text{ ms}$ | Slow menus cause customers to abandon ordering. |
| **Order Status Polling (p95)** | $\le 120\text{ ms}$ | $> 300\text{ ms}$ | Lightweight status queries must not clog connections. |
| **KDS Status Update (p95)** | $\le 300\text{ ms}$ | $> 600\text{ ms}$ | Kitchen staff need immediate tactile confirmation. |
| **Owner Dashboard SSR (p95)** | $\le 1,200\text{ ms}$ | $> 2,500\text{ ms}$ | 14 analytical queries must complete under 2.5s. |
| **PostgreSQL Lock Waits** | $0$ deadlocks | $> 0$ deadlocks | Deadlocks cause rolled-back transactions. |
| **Connection Starvation** | $0$ queued conns | $> 5$ waiting | Indicates connection pool exhaustion. |

---

## 8. Directory Structure of Implementation

All load testing scripts, mock servers, and seeders reside strictly in an isolated directory:

```
load-tests/
├── README.md                           # Usage guide and execution instructions
├── config/
│   └── test-config.json                # Target URLs, thresholds, tenant slugs
├── scripts/
│   ├── seed-staging-data.ts            # Synthetic multi-tenant seeder (Drizzle)
│   ├── cleanup-staging-data.ts         # Non-destructive teardown script
│   └── mock-doku-webhook.ts            # Local HMAC payment gateway mock
├── monitoring/
│   └── monitor-vps-resources.sh        # Server & PostgreSQL resource logger
├── scenarios/
│   ├── 01-storefront-journey.js        # k6 script: Customer QR ordering
│   ├── 02-cashier-journey.js           # k6 script: Cashier POS checkout
│   ├── 03-kitchen-kds-journey.js       # k6 script: Kitchen display management
│   ├── 04-owner-dashboard-journey.js   # k6 script: Owner reporting & analytics
│   └── 05-combined-rush-workload.js    # k6 master script: Full restaurant simulation
└── runner/
    └── run-load-test.ts                # TypeScript alternative runner (dependency-free)
```
