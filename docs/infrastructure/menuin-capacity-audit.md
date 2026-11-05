# MENUIN — Infrastructure Capacity, Database & VPS Cost Audit

> **Document Type:** Senior Infrastructure & Database Engineering Audit  
> **Target System:** MENUIN Multi-Tenant Restaurant POS & QR Ordering Platform  
> **Status:** Production Source-of-Truth Audit  
> **Audit Date:** 27 October 2026  
> **Scope:** Full-stack Architecture (`apps/web`, `packages/*`), PostgreSQL Database Engine, Drizzle ORM, Runtime Workload, Single-VPS Feasibility, and Capacity Budget (IDR)  
> **Auditor Role:** Senior Backend Engineer, Database Performance Engineer & Infrastructure Architect  

---

## 1. Executive Summary

This technical audit evaluates the capacity, performance boundaries, and hosting economics of the **MENUIN** platform when hosted on a **Single Virtual Private Server (VPS)** compared to its current managed hybrid setup.

### Core Findings & Verifications:
1. **Application Architecture Reality:**
   MENUIN is built as a Next.js 15.3 (App Router) full-stack application running React 19. It relies heavily on **React Server Components (RSC)** and **Server Actions** (`"use server"`). Database access is handled directly via **Drizzle ORM** with `postgres.js` pooling.
   
2. **Current vs. Single-VPS Architecture:**
   Currently, MENUIN relies on **Supabase Managed Services** for:
   - Supabase Auth (`@supabase/ssr` with network calls to `auth.getUser()`)
   - Supabase Realtime (WebSocket CDC publication for order updates on `transactions`)
   - Supabase Storage (S3-compatible bucket for menu images and KYC documents)
   Migrating to a single VPS requires either deploying self-hosted supporting containers (Supabase Docker stack or lightweight alternatives like GoTrue/custom JWT, MinIO, Soketi/Centrifugo) or maintaining a hybrid architecture where Auth/Storage remain external while Compute and PostgreSQL reside on the VPS.

3. **High-Impact Workload Drivers (Codebase Inefficiencies):**
   - **Context Resolution Overhead:** Every single authenticated Server Action and protected page view executes `getCurrentContext()`, making **1 external HTTP call to Supabase Auth** followed by **4 sequential SQL queries** (`accounts`, `tenants`, `memberships`, `subscriptions`).
   - **Global Unscoped Query:** In [products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) and [mobile/v1/pos/route.ts:85](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/api/mobile/v1/pos/route.ts#L85), `db.select().from(productModifierGroups)` is executed **without a `tenantId` WHERE filter**, loading every row in the entire table across all tenants into Node.js memory.
   - **Unbounded Storefront Aggregation:** In [store/[slug]/page.tsx:59-67](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L59-L67), every customer opening the QR menu triggers a dynamic database query executing `SUM(quantity) ... GROUP BY productId` over the entire historical `transaction_items` table for that tenant.
   - **In-Memory Report Crunching:** [reports.ts:196-261](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts#L196-L261) pulls thousands of raw transaction and item rows into Node.js heap and aggregates metrics using JavaScript `forEach` loops rather than database SQL aggregations.
   - **Storefront & KDS Polling:** The active order banner ([active-order-banner.tsx:70](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/active-order-banner.tsx#L70)) polls every 15s; the order status page ([status/page.tsx:135](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/status/page.tsx#L135)) polls every 10s; and each Realtime order event triggers an HTTP Server Action (`getOrderById`) from every connected screen.

4. **Empirical Storage Profile:**
   Based on direct inspection of the live PostgreSQL database:
   - `transactions`: ~680 bytes/row on disk (data: 229 B, indexes: 447 B — indexes are 1.95x data size).
   - `transaction_items`: ~210 bytes/row on disk (15,508 items across 7,619 transactions = **2.04 items/transaction**).
   - Full transaction lifecycle footprint (including shifts, cash movements, payments, WAL, autovacuum dead tuple headroom): **~2.2 KB / transaction**.

5. **Single-VPS Sizing Verdict:**
   - **10–25 Outlets:** Reliably handled by a **4 vCPU / 8 GB RAM** VPS (Rp650,000/mo).
   - **50 Outlets:** Supported on **4 vCPU / 8 GB RAM** (low/base load) or **8 vCPU / 16 GB RAM** (peak rush) (Rp750,000 – Rp1,350,000/mo).
   - **100 Outlets:** Requires **8 vCPU / 16 GB RAM** with connection pooling (PgBouncer) and critical query fixes.
   - **250 Outlets:** Reaches the physical limit of a single VPS; requires **16 vCPU / 32 GB RAM** with Redis caching.
   - **500 Outlets:** **A single VPS is strictly NOT recommended.** Requires splitting into App Node(s) and a Dedicated Database Server.

---

## 2. Verified Architecture Map

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                   CLIENT TIERS                                         │
├───────────────────────────────┬───────────────────────────────┬────────────────────────┤
│     Customer Storefront       │         POS Cashier           │    Kitchen (KDS)       │
│  - Mobile Web (QR Scan)       │  - Next.js Web POS            │  - Kanban Board Screen │
│  - Polling (10s - 15s)        │  - React Native Mobile App    │  - Realtime WS Listener│
└───────────────┬───────────────┴───────────────┬───────────────┴────────────┬───────────┘
                │ HTTP / Server Actions         │ JWT API / Server Actions   │ WS / HTTP
                ▼                               ▼                            ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              REVERSE PROXY (NGINX / CADDY)                             │
│  - SSL Termination (Let's Encrypt), Gzip/Brotli, Static Asset Cache, Rate Limiting     │
└───────────────────────────────────────┬────────────────────────────────────────────────┘
                                        │ HTTP (port 3000)
                                        ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                          NEXT.JS 15 RUNTIME (NODE.JS 20 LTS)                           │
│  ├── App Router (SSR, Dynamic Server Components, Route Handlers)                       │
│  ├── Server Actions Layer (`auth-context.ts`, `orders.ts`, `reports.ts`, `pos-qris.ts`) │
│  ├── DOKU Webhook Handler (`/api/webhook/doku`) & SNAP QRIS (`/api/snap/v1.0/*`)       │
│  ├── Mobile REST API (`/api/mobile/v1/*` with stateless JWT verification)              │
│  └── Drizzle ORM Engine (`postgres.js` pool, `prepare: false`)                         │
└───────────────────┬───────────────────────────────────────┬────────────────────────────┘
                    │ Direct SQL (Port 5432)                │ External HTTPS
                    ▼                                       ▼
┌───────────────────────────────────────┐   ┌────────────────────────────────────────────┐
│      POSTGRESQL 15+ DATABASE          │   │         EXTERNAL CLOUD SERVICES            │
│  - 41 Tables, 4 Custom ENUMs          │   │  - Supabase Auth (GoTrue API)              │
│  - RLS Security Policies              │   │  - Supabase Realtime (WebSocket Server)    │
│  - WAL Replication (`supabase_realtime`) │  - Supabase Storage (S3 Image Buckets)      │
│  - Shared Buffers, Autovacuum Daemon  │   │  - DOKU Payment Gateway (Checkout & SNAP)  │
└───────────────────────────────────────┘   └────────────────────────────────────────────┘
```

### Component Breakdown & Resource Consumption

| Component | Current Host | Single-VPS Target Host | Communication Protocol | Resource Impact |
|---|---|---|---|---|
| **Next.js Web App** | Vercel / Node Server | VPS (PM2 / Docker) | HTTP / IPC | High CPU (SSR/Aggregation), High RAM (~350–800 MB heap) |
| **Mobile API Router** | Next.js API Routes | VPS (same Next.js) | REST JSON (JWT) | Low CPU, Low RAM (stateless) |
| **PostgreSQL Database** | Supabase Managed | VPS Localhost:5432 | TCP / Unix Socket | High RAM (shared_buffers), High Disk I/O, Moderate CPU |
| **Authentication** | Supabase Auth Cloud | External or Local GoTrue | HTTPS / Local API | Network Latency (1 RTT per uncached auth action) |
| **Realtime PubSub** | Supabase Realtime Cloud | External or Local Container | WebSockets (WSS) | Moderate RAM, Persistent TCP sockets |
| **Media / Storage** | Supabase Storage (S3) | Cloudflare R2 / Local Nginx | HTTPS / Static disk | Offloaded to external storage recommended |
| **Payment Gateway** | DOKU Production / Sandbox | External API | HTTPS Outbound / Webhook Inbound | Negligible VPS impact, network dependent |

---

## 3. Repository Files and Functions Inspected

The following source files were audited directly from the workspace:

1. **Database Client & Connection:**
   - [apps/web/src/lib/db/index.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/db/index.ts): Drizzle ORM client initialization with `postgres(connectionString, { prepare: false })`.
   - [apps/web/src/lib/db/schema.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/db/schema.ts): 41 table definitions, foreign keys, compound indexes, relations.
   - [apps/web/scripts/sync-schema-additive.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/scripts/sync-schema-additive.ts): Non-destructive additive database migration runner.
   - [schema.sql](file:///home/zidaneelfasya/D/Github/menuin/schema.sql) & [production-schema.sql](file:///home/zidaneelfasya/D/Github/menuin/production-schema.sql): PostgreSQL DDL source of truth.

2. **Authentication & Multi-Tenant Resolvers:**
   - [apps/web/src/lib/actions/auth-context.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/auth-context.ts): `getCurrentContext()`, `getAuthenticatedAccount()`, `getActiveTenant()`, `getMembership()`, `getSubscription()`.
   - [apps/web/src/lib/supabase/server.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/supabase/server.ts) & [middleware.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/supabase/middleware.ts): Supabase server client and session cookies.
   - [apps/web/src/proxy.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/proxy.ts): Custom reverse proxy / subdomain routing logic.

3. **Core Transactional & Catalog Workflows:**
   - [apps/web/src/lib/pos/create-pos-transaction.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/pos/create-pos-transaction.ts): `insertPosTransaction()` — transactional checkout, queue generation, and stock decrement.
   - [apps/web/src/lib/orders/get-next-queue-number.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/orders/get-next-queue-number.ts): `getNextQueueNumber()` — queue number max sequence query.
   - [apps/web/src/lib/actions/public-catalog.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/public-catalog.ts): `createPublicOrder()`, `findPublicOrder()`, storefront order creation.
   - [apps/web/src/lib/actions/products.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts): `getProducts()` — catalog fetch with global unscoped query.
   - [apps/web/src/lib/actions/categories.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/categories.ts) & [modifiers.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/modifiers.ts): Modifier and category management.

4. **Realtime, Polling, & Kitchen Display:**
   - [apps/web/src/features/orders/components/kanban-board.tsx](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/components/kanban-board.tsx): Supabase Realtime channel `kanban-orders-${tenantId}`, `silentReconcile()`, 90s heartbeat.
   - [apps/web/src/app/store/[slug]/active-order-banner.tsx](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/active-order-banner.tsx): 15-second active order poll.
   - [apps/web/src/app/store/[slug]/status/page.tsx](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/status/page.tsx): 10-second order status poll with online payment verification.

5. **Analytics & Financial Reports:**
   - [apps/web/src/lib/actions/reports.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts): `getSalesReport()`, `getOperationsReport()`, `getFinanceReport()` (2,747 lines).
   - [apps/web/src/lib/actions/dashboard.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/dashboard.ts): `getDashboardDataForTenant()` (1,198 lines, 14 parallel queries).

6. **Payment Gateway & Background Services:**
   - [apps/web/src/lib/payments/payment.service.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/payments/payment.service.ts): DOKU webhook processing, SNAP QRIS generation, settlement.
   - [apps/web/src/app/api/webhook/doku/route.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/api/webhook/doku/route.ts): Inbound webhook endpoint with raw body verification.
   - [apps/web/src/app/api/cron/payment-reconcile/route.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/api/cron/payment-reconcile/route.ts): Periodic reconciliation job.

---

## 4. Actual User-Journey Request Inventory

The following table itemizes the exact request footprint and database operation count for the 18 user journeys:

| No | User Journey | Browser HTTP Requests | Server Executions | DB Queries (SQL) | External API Calls | Data Volume (KB) | Nature & Polling Characteristics |
|---|---|---|---|---|---|---|---|
| 1 | **Owner opens Dashboard** | 1 GET Document | 1 RSC Execution | **18 queries** | 1 (Supabase Auth) | ~80 KB | Sync; 14 parallel analytical queries |
| 2 | **Cashier opens POS** | 1 GET Document | 1 RSC Execution | **12 queries** | 1 (Supabase Auth) | ~120 KB | Sync; loads full catalog & unscoped modifiers |
| 3 | **Cashier searches product** | 0 (Client-side) | 0 | 0 | 0 | 0 | In-memory filtering in browser |
| 4 | **Cashier creates order** | 0 (Client-side) | 0 | 0 | 0 | 0 | Zustand cart state |
| 5 | **Cashier configures modifiers** | 0 (Client-side) | 0 | 0 | 0 | 0 | Sheet UI state |
| 6 | **Cashier completes payment** | 1 POST Action | 1 Server Action | **15 queries** (3 items) | 0 | ~2 KB | Atomic DB Transaction; triggers WAL event |
| 7 | **Inventory deduction** | 0 (Atomic in #6) | Part of #6 | In #6 (`UPDATE products`) | 0 | 0 | Stock decremented in transaction loop |
| 8 | **Kitchen receives order** | 1 POST Action | 1 Server Action | **2 queries** | 0 | ~4 KB | Triggered by Realtime event on all open KDS |
| 9 | **Kitchen updates status** | 1 POST Action | 1 Server Action | **6 queries** | 0 | ~1 KB | Sync action + Realtime broadcast |
| 10 | **Customer opens Storefront QR** | 1 GET Document | 1 Dynamic SSR | **7 queries** | 0 | ~95 KB | Uncached SSR; full historical aggregation |
| 11 | **Customer browses menu** | 0 (Client-side) | 0 | 0 | 0 | 0 | In-memory category tab switching |
| 12 | **Customer submits self-order** | 1 POST Action | 1 Server Action | **6 queries** | 0 (or 1 DOKU) | ~3 KB | Sync; creates pending transaction |
| 13 | **Owner opens Sales Report** | 1 GET Document | 1 Server Action | **9 queries** | 1 (Supabase Auth) | ~350 KB | Heavy; raw rows streamed to Node memory |
| 14 | **Owner opens Finance Report** | 1 GET Document | 1 Server Action | **8 queries** | 1 (Supabase Auth) | ~110 KB | Incomes, expenses, and budget joins |
| 15 | **Staff opens / closes shift** | 1 POST Action | 1 Server Action | **6–8 queries** | 1 (Supabase Auth) | ~2 KB | Calculates cash difference and updates shift |
| 16 | **Staff records cash movement** | 1 POST Action | 1 Server Action | **6 queries** | 1 (Supabase Auth) | ~1 KB | Mutates `cash_movements` table |
| 17 | **Idle outlet with open POS/KDS** | Recurring HTTP | Scheduled | **~40 req/hr, ~120 SQL/hr** | 0 | ~5 KB/poll | 90s heartbeat + focus/visibility reconcile |
| 18 | **Outlet in Peak Rush Hour** | ~120 HTTP/hr | Concurrent Actions | **~1,200 SQL/hr** | ~10 DOKU/hr | Heavy | 40 orders/hr + active status pollers |

---

## 5. Database Query and Index Audit

### 5.1 Critical Query Findings

#### Finding 1: Unscoped Cross-Tenant Query on `product_modifier_groups`
- **Location:** [apps/web/src/lib/actions/products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) & [mobile/v1/pos/route.ts:85](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/api/mobile/v1/pos/route.ts#L85)
- **Query Executed:** `SELECT * FROM product_modifier_groups;`
- **Problem:** No `WHERE tenant_id = ...` filter exists. As more outlets join, this query performs a sequential scan of every product modifier association in the entire platform.
- **Impact:** Memory spike in Node.js, linear degradation of POS load times, cross-tenant data leak risk in application memory.
- **Confidence:** High (Verified directly in code).

#### Finding 2: Full Historical Scan for Storefront Best Sellers
- **Location:** [apps/web/src/app/store/[slug]/page.tsx:59-67](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L59-L67)
- **Query Executed:**
  ```sql
  SELECT product_id, COALESCE(SUM(quantity), 0)::int AS total_sold
  FROM transaction_items
  WHERE tenant_id = $1
  GROUP BY product_id;
  ```
- **Problem:** Executed dynamically on every single QR scan visit. Does not use date boundaries or materialized summaries.
- **Impact:** Disk I/O exhaustion as `transaction_items` grows past 50,000 rows.
- **Confidence:** High (Verified directly in code).

#### Finding 3: In-Memory Financial & Sales Aggregation
- **Location:** [apps/web/src/lib/actions/reports.ts:196-261](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts#L196-L261)
- **Problem:** Fetches all transactions and joined transaction items for the filtered date range into an array in Node.js memory. Loop calculations (`forEach`) compute COGS, revenue, and item counts in JavaScript instead of PostgreSQL.
- **Impact:** Event-loop lag, high memory consumption, risk of process Out-Of-Memory (OOM) during 90-day or 1-year report generation.
- **Confidence:** High (Verified directly in code).

#### Finding 4: Realtime Order Broadcast Stampede
- **Location:** [apps/web/src/features/orders/components/kanban-board.tsx:816-821](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/components/kanban-board.tsx#L816-L821)
- **Problem:** Because PostgreSQL CDC on `transactions` does not include relational items, every connected browser screen (POS, Kitchen, Waiter) receives the WAL event and immediately dispatches an independent `getOrderById(newTx.id)` Server Action.
- **Impact:** An outlet with 3 devices generates 3 concurrent server executions and 6 SQL queries simultaneously for every single order created.
- **Confidence:** High (Verified directly in code).

---

### 5.2 Index Audit & Candidate Indexes

Inspection of PostgreSQL `pg_constraint` and `pg_indexes` reveals **38 foreign keys without supporting indexes**. The most dangerous missing indexes are:

| Table | Column / FK Pattern | Triggering Query Pattern | Recommended Candidate Index | Write/Storage Overhead |
|---|---|---|---|---|
| `transaction_items` | `(tenant_id, created_at)` | [reports.ts:254-260](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts#L254-L260) (Sales report item date filter) | `CREATE INDEX idx_trx_items_tenant_created ON transaction_items (tenant_id, created_at);` | Low write overhead; critical to eliminate seq scans on reports |
| `transactions` | `(tenant_id, shift_id)` | [get-next-queue-number.ts:25-28](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/orders/get-next-queue-number.ts#L25-L28) (Queue max query) | `CREATE INDEX idx_transactions_tenant_shift ON transactions (tenant_id, shift_id);` | Moderate write overhead; speeds up queue generation in busy shifts |
| `transaction_items` | `(tenant_id, product_id)` | [store/[slug]/page.tsx:66](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L66) (Storefront Best Sellers group by) | `CREATE INDEX idx_trx_items_tenant_product ON transaction_items (tenant_id, product_id);` | Low write overhead; enables index-only scan for best seller aggregation |
| `product_modifier_groups` | `(tenant_id, product_id)` | [products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) & POS product mapping | `CREATE INDEX idx_pmg_tenant_product ON product_modifier_groups (tenant_id, product_id);` | Minimal; catalog changes are infrequent |
| `payment_attempts` | `(tenant_id, transaction_id)` | [payment.service.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/payments/payment.service.ts) (Order status verification) | `CREATE INDEX idx_payment_attempts_tenant_tx ON payment_attempts (tenant_id, transaction_id);` | Low; vital for payment lookup & foreign key delete locks |

---

## 6. Workload Scenarios & Calculations

### 6.1 Workload Activity Assumptions

| Variable | Low Activity | Base Activity | High Activity | Evidence or Rationale |
|---|---:|---:|---:|---|
| **Transactions / outlet / day** | 30 | 80 | 200 | Coffee shop vs. busy casual dining vs. high-turnover fast food |
| **Storefront QR sessions / day** | 60 | 200 | 600 | 2–3 visitors browsing menu per ordering customer |
| **Active Cashier POS devices** | 1 | 1 | 2 | Single counter vs. dual checkout counters |
| **Dedicated Kitchen KDS screens** | 0 (Paper/POS) | 1 | 1–2 | Tablet screen mounted in kitchen/bar |
| **Average items per order** | 1.8 | 2.04 | 2.6 | Measured 2.04 empirical average in current database |
| **Operating hours per day** | 10 hours | 12 hours | 14 hours | Standard Indonesian F&B operating schedule |
| **Peak Concentration Factor** | 3.0x | 3.5x | 4.5x | Lunch (12:00–13:30) and dinner (19:00–20:30) rush spikes |

---

### 6.2 Workload Projection Matrix

Calculations use the formula:
$$\text{Average RPS} = \frac{\text{Total Daily HTTP Requests}}{86,400}$$
$$\text{Peak RPS} = \left(\frac{\text{Total Daily HTTP Requests}}{\text{Active Hours} \times 3,600}\right) \times \frac{\text{Peak Concentration Factor}}{2}$$

#### A. Low Activity Scenario (30 trx/outlet/day)
| Outlets | Daily Transactions | Daily HTTP Requests | Average RPS | Estimated Peak RPS | Peak SQL Stmts / sec |
|---|---:|---:|---:|---:|---:|
| **10** | 300 | 21,500 | 0.25 | **0.7** | 2.1 |
| **25** | 750 | 53,750 | 0.62 | **1.9** | 5.3 |
| **50** | 1,500 | 107,500 | 1.24 | **3.7** | 10.7 |
| **100** | 3,000 | 215,000 | 2.49 | **7.5** | 21.4 |
| **250** | 7,500 | 537,500 | 6.22 | **18.7** | 53.4 |
| **500** | 15,000 | 1,075,000 | 12.44 | **37.3** | 106.9 |

#### B. Base Activity Scenario (80 trx/outlet/day — Realistic Standard)
| Outlets | Daily Transactions | Daily HTTP Requests | Average RPS | Estimated Peak RPS | Peak SQL Stmts / sec |
|---|---:|---:|---:|---:|---:|
| **10** | 800 | 38,220 | 0.44 | **1.5** | 4.4 |
| **25** | 2,000 | 95,550 | 1.11 | **3.9** | 11.1 |
| **50** | 4,000 | 191,100 | 2.21 | **7.7** | 22.2 |
| **100** | 8,000 | 382,200 | 4.42 | **15.5** | 44.3 |
| **250** | 20,000 | 955,500 | 11.06 | **38.7** | 110.8 |
| **500** | 40,000 | 1,911,000 | 22.12 | **77.4** | 221.7 |

#### C. High Activity Scenario (200 trx/outlet/day — Busy Outlets)
| Outlets | Daily Transactions | Daily HTTP Requests | Average RPS | Estimated Peak RPS | Peak SQL Stmts / sec |
|---|---:|---:|---:|---:|---:|
| **10** | 2,000 | 78,350 | 0.91 | **4.1** | 11.7 |
| **25** | 5,000 | 195,875 | 2.27 | **10.2** | 29.2 |
| **50** | 10,000 | 391,750 | 4.53 | **20.4** | 58.4 |
| **100** | 20,000 | 783,500 | 9.07 | **40.8** | 116.8 |
| **250** | 50,000 | 1,958,750 | 22.67 | **102.0** | 292.1 |
| **500** | 100,000 | 3,917,500 | 45.34 | **204.0** | 584.2 |

---

## 7. Database Sizing and Storage Projections

### 7.1 Unit Row Footprint (Verified from Live Catalog)
- `transactions`: 229 B data + 447 B index = **676 B / row**
- `transaction_items` (2.04 items/trx): 2.04 × (130 B data + 80 B index) = **428 B**
- Supporting tables per transaction (`payment_attempts`, `shifts`, `cash_movements`, `audit_logs` amortized): **~450 B**
- PostgreSQL MVCC, dead tuples before autovacuum, WAL buffer allocation (+40% overhead): **~650 B**
- **Net Operational On-Disk Cost:** **~2.2 KB per completed transaction lifecycle**.

### 7.2 Storage Growth Projections

| Outlets | Activity Level | Daily Trx | 30 Days (Disk MB) | 90 Days (Disk MB) | 1 Year (Disk GB) | Recommended NVMe Allocation |
|---|---|---:|---:|---:|---:|---|
| **10 Outlets** | Low | 300 | 19.2 MB | 57.6 MB | 0.23 GB | 40 GB NVMe |
| | Base | 800 | 51.6 MB | 154.8 MB | 0.61 GB | 40 GB NVMe |
| | High | 2,000 | 129.0 MB | 387.0 MB | 1.53 GB | 60 GB NVMe |
| **25 Outlets** | Base | 2,000 | 129.0 MB | 387.0 MB | 1.53 GB | 60 GB NVMe |
| | High | 5,000 | 322.2 MB | 966.6 MB | 3.83 GB | 80 GB NVMe |
| **50 Outlets** | Base | 4,000 | 257.7 MB | 773.1 MB | 3.06 GB | 80 GB NVMe |
| | High | 10,000 | 644.4 MB | 1,933.2 MB | 7.66 GB | 120 GB NVMe |
| **100 Outlets** | Base | 8,000 | 515.7 MB | 1,547.1 MB | 6.13 GB | 120 GB NVMe |
| | High | 20,000 | 1,289.1 MB | 3,867.3 MB | 15.32 GB | 200 GB NVMe |
| **250 Outlets** | Base | 20,000 | 1,289.1 MB | 3,867.3 MB | 15.32 GB | 250 GB NVMe |
| | High | 50,000 | 3,222.6 MB | 9,667.8 MB | 38.29 GB | 400 GB NVMe |
| **500 Outlets** | Base | 40,000 | 2,578.2 MB | 7,734.6 MB | 30.63 GB | 500 GB NVMe |
| | High | 100,000 | 6,445.2 MB | 19,335.6 MB | 76.58 GB | 1,000 GB NVMe |

*Note: Recommended NVMe allocation includes OS, WAL logs (minimum 10 GB), temp files for large joins/sorts (minimum 10 GB), local database backup snapshots (minimum 2x DB size), and 30% unpartitioned free space to prevent SSD performance degradation.*

---

## 8. Single-VPS Infrastructure Design & Sizing Scenarios

### 8.1 Stack Topology for Single-VPS Deployment
On a single Ubuntu 24.04 LTS VPS, the verified production process layout is:
- **Nginx / Caddy:** Port 80/443 (Reverse proxy, HTTP/2, SSL termination, static file caching).
- **Node.js (Next.js Standalone):** Port 3000 (Managed via PM2 with 2 to 4 cluster workers).
- **PostgreSQL 15+:** Local Unix Socket / Port 5432 (Tuned `shared_buffers`, `work_mem`).
- **PgBouncer (Recommended):** Port 6432 (Transaction pooling to prevent connection starvation).
- **Optional Local Realtime Broker:** Centrifugo or Soketi (if decoupling from Supabase Cloud Realtime).
- **Scheduled Tasks:** OS Cron triggering `/api/cron/*` via local loopback.

---

### 8.2 VPS Candidate Configurations

| Scale | Target Specs | Node.js Worker Config | PostgreSQL Shared Buffers | Max DB Conns | Primary Bottleneck Risk | Upgrade Trigger |
|---|---|---|---|---|---|---|
| **Initial (10–25 Outlets)** | **2–4 vCPU, 8 GB RAM, 80 GB NVMe** | 2 PM2 cluster workers (~1 GB RAM) | 2 GB | 50 | CPU spikes on unindexed report queries | CPU > 70% for 15 min or RAM > 80% |
| **Growth (25–50 Outlets)** | **4 vCPU, 8 GB RAM, 120 GB NVMe** | 3 PM2 cluster workers (~1.5 GB RAM) | 2 GB | 80 | Connection pool starvation during peak rush | PgBouncer waiting queue > 10 conns |
| **Mid-Scale (50–100 Outlets)** | **8 vCPU, 16 GB RAM, 250 GB NVMe** | 4 PM2 cluster workers (~2.5 GB RAM) | 4 GB | 120 | Disk I/O & WAL generation during rush hours | Disk I/O wait > 15%, query p95 > 500ms |
| **Scale (100–250 Outlets)** | **16 vCPU, 32 GB RAM, 500 GB NVMe** | 6 PM2 cluster workers (~4 GB RAM) | 8 GB | 200 | Event-loop blocking from Storefront aggregation | Node.js event-loop lag > 80ms |
| **Enterprise (250–500 Outlets)** | **Split Architecture Required:**<br>• App Node: 16 vCPU / 32 GB<br>• DB Node: 16 vCPU / 64 GB | 8 PM2 workers per App Node | 16 GB | 400 | Single VPS CPU contention between Next.js SSR and PostgreSQL | Single VPS reaches physical ceiling |

---

### 8.3 Low-Spec VPS Evaluation: 1 Core 2 GB vs 2 Core 4 GB for 10 Outlets

A common business consideration is minimizing early hosting expenditures by utilizing entry-level VPS instances (e.g. 1 vCPU / 2 GB RAM at ~Rp 120,000/mo or 2 vCPU / 4 GB RAM at ~Rp 250,000–350,000/mo). This section details the technical feasibility, memory allocation, and failure modes for a 10-outlet workload.

#### A. The 1 vCPU / 2 GB RAM Tier (HIGH RISK — NOT RECOMMENDED FOR ALL-IN-ONE)
- **Memory Allocation Breakdown:**
  - OS Linux (Ubuntu 24.04 Server, systemd, SSH, logging): **~400 MB**
  - PostgreSQL Engine (512 MB `shared_buffers` + WAL + 10 pool connections): **~800 MB**
  - Sisa RAM untuk Next.js Runtime: $2048 - 400 - 800 = \mathbf{848\text{ MB}}$
- **Failure Mode (Linux OOM Killer):**
  - Next.js 15 with React 19 SSR baseline heap requires ~400 MB.
  - When a cashier loads the Shift page (triggering the N+1 query loop) or an owner generates a 30-day Sales Report (which streams raw transaction objects into memory via [reports.ts](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts)), Node.js memory immediately spikes above 1 GB.
  - The Linux kernel OOM Killer terminates either the Node.js process or PostgreSQL master process (`Out of memory: Kill process (node) or (postgres)`), causing immediate `502 Bad Gateway` across all 10 outlets.
- **CPU Starvation:**
  - PostgreSQL and Node.js share 1 single hardware thread. When PostgreSQL executes a full-table scan, CPU reaches 100%, causing the single-threaded Node.js event loop to starve and drop incoming HTTP checkout requests.

#### B. The 2 vCPU / 4 GB RAM Tier (VIABLE WITH QUERY REMEDIATION — RECOMMENDED COST SAVER)
- **Memory Allocation Breakdown:**
  - OS Linux + Nginx Reverse Proxy: **~500 MB**
  - PostgreSQL Database (`shared_buffers = 1 GB`, `work_mem = 16MB`, 30 conns): **~1.3 GB**
  - Next.js Application (`NODE_OPTIONS="--max-old-space-size=1536"`): **~1.5 GB**
  - Linux Page Cache & Safety Headroom: **~700 MB**
- **Feasibility Verdict:**
  - **SANGAT LAYAK (Viable) for 10 outlets**, provided that the 3 critical query bottlenecks (Shift N+1 loop, unscoped `productModifierGroups`, and in-memory reports) are patched before deployment.
  - 2 vCPUs eliminate CPU starvation (PostgreSQL executes queries on Core 1 while the Node.js event loop handles HTTP traffic on Core 2).
  - Monthly VPS cost drops from ~Rp 650,000–850,000 down to **~Rp 250,000–350,000 / month**, saving over 50% in initial infrastructure expense.

#### C. Split Alternative (Next.js on 2 Core / 4 GB VPS + Managed Supabase Database)
If PostgreSQL remains hosted on Supabase Cloud (Free/Pro tier) and the VPS exclusively hosts Next.js + Nginx:
- A **2 vCPU / 4 GB RAM VPS is optimal and exceptionally stable** for up to 25 outlets because the entire 4 GB RAM and 2 cores are dedicated solely to Next.js server-side rendering and Server Actions.

---

## 9. Performance & Load-Test Plan

To validate these calculations in a staging environment prior to VPS cutover, execute the following load testing protocol using **K6** or **Autocannon**:

### 9.1 Test Phases & Traffic Mix

```
Virtual Users (VU)
   ▲
500│                                    ┌──────────────┐ (Phase 4: Stress)
   │                                    │              │
250│                     ┌──────────────┘              └──────────────┐
   │                     │ (Phase 3: Peak Rush Hour)                  │
100│      ┌──────────────┘                                            └──────────────┐
   │      │ (Phase 2: Expected Base Load)                                            │ (Phase 5: Soak)
 25│──────┘                                                                          └──────────
   └──────────────────────────────────────────────────────────────────────────────────────────► Time
          0m            10m            25m            35m            45m           120m
```

### 9.2 Test Scenarios & Endpoints
1. **Storefront Browsing (`GET /store/[slug]?table=5`):** 60% of traffic mix. Validates SSR throughput and the impact of the `transaction_items` best-seller aggregation.
2. **Order Placement (`POST createPublicOrder`):** 15% of traffic mix. Validates atomic inserts, queue number generation, and sequence locking.
3. **Active Order Polling (`GET /store/[slug]/status?order=...`):** 15% of traffic mix. Validates 10-second polling load under concurrent visitors.
4. **Cashier POS Checkout (`POST checkoutPosOrder`):** 7% of traffic mix. Validates transaction commit latency and product stock decrement under concurrency.
5. **Sales Report Fetch (`GET getSalesReport?period=30days`):** 3% of traffic mix. Validates memory pressure and event-loop lag during concurrent manager reporting.

### 9.3 Pass/Fail Thresholds
- **HTTP Success Rate:** $\ge 99.5\%$ (error rate $< 0.5\%$).
- **p95 Latency:**
  - Storefront SSR: $< 350\text{ ms}$
  - Order Checkout Action: $< 500\text{ ms}$
  - Status Polling: $< 150\text{ ms}$
  - Reports: $< 1,500\text{ ms}$
- **Database Metrics:** Zero connection timeouts, zero deadlocks, connection wait time $< 50\text{ ms}$.

---

## 10. Infrastructure RAB (Rancangan Anggaran Biaya in IDR)

### 10.1 Itemized Monthly Infrastructure Cost per Scale

| Expense Component | 10 Outlets | 25 Outlets | 50 Outlets | 100 Outlets | 250 Outlets | 500 Outlets (Split Arch) |
|---|---:|---:|---:|---:|---:|---:|
| **Cloud VPS Rental (NVMe)** | Rp 300,000 | Rp 650,000 | Rp 750,000 | Rp 1,350,000 | Rp 2,600,000 | Rp 6,500,000 |
| **Domain & DNS (.id / Cloudflare)** | Rp 21,000 | Rp 21,000 | Rp 21,000 | Rp 21,000 | Rp 21,000 | Rp 42,000 |
| **Off-Site Backup Storage (R2/S3)** | Rp 25,000 | Rp 45,000 | Rp 75,000 | Rp 150,000 | Rp 300,000 | Rp 600,000 |
| **Transactional Email (Resend)** | Rp 150,000 | Rp 150,000 | Rp 150,000 | Rp 200,000 | Rp 350,000 | Rp 500,000 |
| **Uptime Monitoring & Alerts** | Rp 0 (Free) | Rp 0 (Free) | Rp 0 (Free) | Rp 150,000 | Rp 250,000 | Rp 450,000 |
| **Total Monthly Infrastructure** | **Rp 496,000** | **Rp 866,000** | **Rp 996,000** | **Rp 1,871,000** | **Rp 3,521,000** | **Rp 8,092,000** |
| **Annualized Infrastructure Cost** | **Rp 5,952,000** | **Rp 10,392,000** | **Rp 11,952,000** | **Rp 22,452,000** | **Rp 42,252,000** | **Rp 97,104,000** |
| **Cost Per Outlet / Month** | **Rp 49,600** | **Rp 34,640** | **Rp 19,920** | **Rp 18,710** | **Rp 14,084** | **Rp 16,184** |

---

### 10.2 Infrastructure Cost vs. Subscription Revenue

MENUIN's official subscription tiers:
- **Menuin Toko:** Rp 49,900 / month
- **Menuin Pro:** Rp 74,900 / month
- **Menuin Enterprise:** Rp 149,900 / month

We evaluate across two realistic subscription distributions:
- **Mix A (Starter Heavy):** 70% Toko (49.9k), 25% Pro (74.9k), 5% Enterprise (149.9k) $\rightarrow$ **Average: Rp 61,150 / outlet / month**.
- **Mix B (Balanced / Pro Dominant):** 30% Toko (49.9k), 60% Pro (74.9k), 10% Enterprise (149.9k) $\rightarrow$ **Average: Rp 74,900 / outlet / month**.

| Outlets | Total Monthly Infra Cost | Monthly Revenue (Mix A) | Infra % of Revenue (Mix A) | Monthly Revenue (Mix B) | Infra % of Revenue (Mix B) |
|---|---:|---:|---:|---:|---:|
| **10 Outlets** | Rp 496,000 | Rp 611,500 | **81.1%** | Rp 749,000 | **66.2%** |
| **25 Outlets** | Rp 866,000 | Rp 1,528,750 | **56.6%** | Rp 1,872,500 | **46.2%** |
| **50 Outlets** | Rp 996,000 | Rp 3,057,500 | **32.6%** | Rp 3,745,000 | **26.6%** |
| **100 Outlets** | Rp 1,871,000 | Rp 6,115,000 | **30.6%** | Rp 7,490,000 | **25.0%** |
| **250 Outlets** | Rp 3,521,000 | Rp 15,287,500 | **23.0%** | Rp 18,725,000 | **18.8%** |
| **500 Outlets** | Rp 8,092,000 | Rp 30,575,000 | **26.5%** | Rp 37,450,000 | **21.6%** |

*Key Financial Takeaway: At 10–25 outlets, fixed base costs dominate the cost ratio (46–81%). As scale surpasses 50 outlets, infrastructure costs stabilize at a highly sustainable **18% to 26% of gross SaaS revenue**, yielding strong gross margins.*

---

## 11. Performance Bottlenecks Ranked by Severity

| Severity | Bottleneck Description | Impacted Flows | Root Cause in Codebase | Remediation |
|---|---|---|---|---|
| **CRITICAL** | **Unbounded Storefront Aggregation** | Customer QR Scan (`/store/[slug]`) | [store/[slug]/page.tsx:59-67](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L59-L67) runs `SUM(quantity)` on entire tenant `transaction_items` | Cache Top Sellers in Redis / tenant column, update only on order completion |
| **CRITICAL** | **Global Table Scan on Product Modifiers** | POS Load (`/outlet/.../pos`), Products Page | [products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) queries all rows of `productModifierGroups` across all tenants | Add `.where(eq(productModifierGroups.tenantId, user.tenantId))` |
| **CRITICAL** | **Shift History N+1 Query Loop & Duplication** | Shift Page (`/outlet/.../shifts`) | [shifts.ts:316-332](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts#L316-L332) executes an unindexed query per shift; [layout.tsx:17](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/shifts/layout.tsx#L17) duplicates `getActiveShift()` | Replace N+1 with single `LEFT JOIN ... GROUP BY`, add `LIMIT 15` pagination, wrap in `React.cache()` |
| **HIGH** | **In-Memory Report Deserialization** | Sales Report (`reports/sales`) | [reports.ts:196-261](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts#L196-L261) pulls thousands of raw rows into Node heap for JS loops | Migrate to SQL aggregations (`SUM`, `GROUP BY`) or read from `daily_sales_summaries` |
| **HIGH** | **Sequential Context Auth Overhead** | Every authenticated Server Action | [auth-context.ts:162-207](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/auth-context.ts#L162-L207) calls Supabase API + 4 sequential DB queries | Combine into a single joined query; cache session context in encrypted cookie / JWT |
| **MEDIUM** | **Realtime Broadcast Stampede** | Kitchen Display & POS | [kanban-board.tsx:820](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/components/kanban-board.tsx#L820) fires HTTP `getOrderById` on every screen per order | Include minimal item payload in the broadcast event to eliminate the HTTP round-trip |
| **MEDIUM** | **Missing FK Indexes on High-Write Tables** | Order creation, shift close | 38 unindexed foreign keys causing table share locks during updates/deletes | Add index on `transaction_items(tenant_id, created_at)` and `transactions(tenant_id, shift_id)` |

---

### 11.1 Deep Dive: Shift Page Latency Breakdown (The 4-Second Bottleneck)

When a cashier navigates to `/outlet/[outletKey]/shifts`, the following sequence executes on the server:

1. **Duplicate Layout & Page Invocations:**
   - In [shifts/layout.tsx:17](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/shifts/layout.tsx#L17), `getActiveShift()` is awaited to render the sidebar.
   - In [shifts/page.tsx:13-17](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/shifts/page.tsx#L13-L17), `getActiveShift()` is awaited a second time inside `Promise.all()`.
   - Without `React.cache()`, all sub-queries (`shifts`, `transactions`, `transaction_items`, `cash_movements`) execute twice per page view.
2. **Unbounded History Fetch:**
   - In [shifts.ts:312](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts#L312), `db.select().from(shifts).where(eq(shifts.tenantId, user.tenantId))` fetches *every shift record ever created* for that outlet without a `LIMIT` clause.
3. **N+1 Transaction Queries via `Promise.all`:**
   - In [shifts.ts:316-332](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts#L316-L332), the server maps over every historical shift and executes an individual `SELECT COUNT, SUM FROM transactions WHERE shift_id = ?`.
   - If an outlet has 60 shifts in its history, **60 concurrent SQL queries** are dispatched.
4. **Unindexed Foreign Key Full Table Scans:**
   - The database catalog confirms that `transactions(shift_id)` has **no index**.
   - Each of the 60 queries forces PostgreSQL to perform a sequential scan across the entire `transactions` table.
5. **Connection Pool Contention & Network Round-Trips:**
   - Because `postgres.js` defaults to 10 connections, the 60 queries queue up. At 35ms network latency per query round-trip to cloud PostgreSQL, this bottleneck alone blocks server-side rendering for **2.5 to 5.0 seconds**. Client device power (CPU/RAM) cannot alleviate this server-side queueing.

---

## 12. Security and Operational Risks of Single-VPS Architecture

1. **Single Point of Failure (SPOF):**
   If the VPS hardware fails, kernel panics, or runs out of disk space, the entire platform (Web, POS, Storefront, Kitchen, and Database) goes down simultaneously for all tenants.
2. **Resource Starvation (Next.js vs. PostgreSQL):**
   A memory leak or heavy report in Next.js can trigger the Linux Out-Of-Memory (OOM) Killer, which frequently terminates the PostgreSQL process (`postgres: writer process`), risking database downtime and recovery rollbacks.
3. **Database Write Latency Spikes:**
   Next.js SSR CPU spikes during rush hours can starve the PostgreSQL process of CPU time, resulting in delayed transaction commits and cashier timeouts.
4. **Mandatory Operational Safeguards:**
   - **Automated Nightly Backups:** Encrypted `pg_dump` pushed off-server to Cloudflare R2 / AWS S3 immediately.
   - **OOM Protection:** Set `vm.oom-kill-allocating-task = 0` and assign a negative `oom_score_adj` (e.g. `-900`) to PostgreSQL master process so Linux kills Node.js worker before touching PostgreSQL.
   - **Swap Space:** Configure 4 GB of NVMe swap space with `vm.swappiness = 10` as a safety buffer against temporary memory spikes.

---

## 13. Unknowns and Measurements Still Required

The following metrics cannot be definitively determined from source code alone and must be benchmarked on the target VPS:
1. **Node.js SSR Heap Growth under Peak RPS:** Requires synthetic benchmarking with Autocannon to measure memory footprint per concurrent connection.
2. **Actual PostgreSQL Disk I/O Write Saturation (IOPS):** Depends heavily on VPS hosting provider hypervisor limits (e.g. 500 IOPS vs. 3,000 IOPS NVMe).
3. **DOKU Webhook Latency & Concurrency:** Real-world network turnaround time during peak bank settlement windows.
4. **Subdomain SSL Handshake Overhead:** Performance impact of dynamic subdomain wildcards (`*.menuin.id`) on Caddy/Nginx memory.

---

## 14. Recommended Next Steps (Ordered by Priority)

1. **Immediate Code Fix (Day 1):**
   - Patch [products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) and [api/mobile/v1/pos/route.ts:85](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/api/mobile/v1/pos/route.ts#L85) to add `where(eq(productModifierGroups.tenantId, tenantId))`.
   - Refactor [shifts.ts:316-332](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts#L316-L332): replace the N+1 `Promise.all` query loop with a single SQL `LEFT JOIN transactions GROUP BY shifts.id` query, and add `LIMIT 15` pagination.
   - Wrap `getActiveShift()` and `getCurrentContext()` with `React.cache()` to eliminate duplicate layout/page executions.
2. **Database Index Deployment (Day 1):**
   Execute `CREATE INDEX` for `transaction_items(tenant_id, created_at)` and `transactions(tenant_id, shift_id)`.
3. **Storefront Aggregation Optimization (Week 1):**
   Replace the dynamic `SUM(quantity)` scan in [store/[slug]/page.tsx](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L59) with cached best-seller product IDs stored on the `tenants` table or an hourly cron update.
4. **Execute Synthetic Load Test (Week 2):**
   Run the 5-phase K6 load test on a staging VPS to verify throughput before cutting over production.
5. **Implement PgBouncer & OOM Protections (Pre-Cutover):**
   Deploy PgBouncer in transaction mode and configure PostgreSQL memory limits (`shared_buffers = 25% RAM`, `work_mem = 16MB`).

---

## 15. Evidence Table

| Finding | Evidence (File & Line) | Impact | Confidence | Recommended Action |
|---|---|---|---|---|
| Unscoped `product_modifier_groups` query | [products.ts:63](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/products.ts#L63) | O(N) cross-tenant memory leak in Node.js | **High** | Add tenant WHERE clause |
| Shift History N+1 query loop | [shifts.ts:316-332](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/shifts.ts#L316-L332) | 50–100+ unindexed queries per shift page load | **High** | Replace with single SQL `JOIN / GROUP BY` + `LIMIT 15` |
| Duplicate `getActiveShift()` execution | [shifts/layout.tsx:17](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/shifts/layout.tsx#L17) & [shifts/page.tsx:13](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/outlet/[outletKey]/shifts/page.tsx#L13) | Doubles query and auth overhead on shift views | **High** | Wrap action in `React.cache()` |
| Dynamic full-table scan on QR storefront | [store/[slug]/page.tsx:59-67](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/app/store/[slug]/page.tsx#L59-L67) | Disk I/O exhaustion under storefront traffic | **High** | Cache best sellers or use precalculated table |
| In-memory aggregation in reports | [reports.ts:196-261](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/reports.ts#L196-L261) | Severe Node.js heap lag on date ranges | **High** | Refactor to SQL `SUM` / `GROUP BY` |
| 4 Sequential queries per authenticated action | [auth-context.ts:162-207](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/lib/actions/auth-context.ts#L162-L207) | 15–30ms baseline latency floor on every action | **High** | Join account, tenant, membership, subscription |
| 38 Unindexed Foreign Keys in PostgreSQL | Database catalog `pg_constraint` vs `pg_index` | Table-level lock risk & slow cascade checks | **High** | Add indexes to `transaction_items` & `transactions` |
| Realtime broadcast triggers 3 HTTP calls per order | [kanban-board.tsx:820](file:///home/zidaneelfasya/D/Github/menuin/apps/web/src/features/orders/components/kanban-board.tsx#L820) | Thundering herd on Next.js server per order | **High** | Embed item snapshot in realtime broadcast |

---

## 16. Assumption Table

| Variable | Low | Base | High | Evidence or Rationale |
|---|---:|---:|---:|---|
| **Transactions per outlet per day** | 30 | 80 | 200 | Coffee shop vs standard cafe vs high-volume diner |
| **Storefront QR sessions per day** | 60 | 200 | 600 | 2–3 menu browse sessions per paying customer |
| **Active concurrent screens per outlet** | 1 | 2 | 4 | Cashier POS, Kitchen KDS, Waiter tablet |
| **Items per transaction** | 1.8 | 2.04 | 2.6 | Measured 2.04 empirical average in current database |
| **Peak concentration factor** | 3.0x | 3.5x | 4.5x | Ratio of lunch/dinner rush RPS to daily average RPS |
| **VPS Cost in Indonesia (IDR)** | Rp 300,000 | Rp 650,000 – Rp 1,350,000 | Rp 2,600,000 | Local Cloud VPS pricing (Biznet GIO, IDCloudHost, DO SG) |
