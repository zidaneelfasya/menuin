# MENUIN — Financial & Business Reporting Research
**A Multi-Disciplinary Product Discovery & Financial Architecture Blueprint**

*Document Status: Final Research & Architecture Specification*  
*Target Product: MENUIN (F&B SaaS & Multi-Outlet POS)*  
*Deliverable Path: `docs/research/menuin-financial-business-reporting.md`*  
*Author Team: Cross-Functional Senior Research Team (Financial Analyst, F&B Business Analyst, Senior BI Analyst, POS Product Manager, Accounting SME)*

---

## 1. Executive Summary

This research establishes the foundational financial, operational, and business reporting architecture for **MENUIN**, a next-generation SaaS Point of Sale (POS) and restaurant management platform catering to single-outlet and multi-outlet Food and Beverage (F&B) operations.

### 1.1 The Core Dilemma in F&B POS Systems
A pervasive failure mode among commercial POS systems is **metric confusion**: conflating *Cash Inflow* with *Revenue*, presenting *Gross Margin from Static Unit Cost* as *Net Profit*, and treating local taxes (PBJT/PB1) and service charges as restaurant income. In emerging markets such as Indonesia, small-to-medium F&B operators routinely face severe cash flow insolvency despite POS dashboards displaying healthy "green profits." This research identifies five root causes:
1. **The Theoretical vs. Actual COGS Blindspot:** POS systems typically calculate Cost of Goods Sold (COGS/HPP) by multiplying static recipe/product cost by sales volume ($HPP_{static} \times Qty$). This ignores actual inventory waste, kitchen spoilage, prep yield loss, shrinkage, and stock count variances, understating true COGS by an average of 3% to 7% of gross sales.
2. **Tax & Pass-Through Distortion:** Under Indonesian law (**UU No. 1/2022 tentang HKPD**), Pajak Barang dan Jasa Tertentu (PBJT) Makanan dan Minuman (max 10%) is a balance sheet trust liability collected on behalf of the local government (*Pemerintah Daerah*), not revenue. When systems display `Total Collected` as "Total Sales", business owners commit tax delinquency and misjudge menu pricing.
3. **Delivery Aggregator Commission Misattribution:** Online food delivery platforms (GoFood, GrabFood, ShopeeFood) deduct 20% commission at settlement. Operators who book the gross cart value as bankable revenue without recognizing aggregator commission expense experience acute reconciliation variances.
4. **Shift & Cash Drawer Leakage:** Discrepancies between expected cash and actual physical cash in the till are frequently buried in summary reports rather than isolated as audit-trailed operational variances.
5. **Feature Bloat vs. Core Value:** POS platforms often attempt to build pseudo-accounting engines (unbalanced ledgers, manual journal entries) that lack double-entry integrity, creating audit liabilities while neglecting essential operational metrics (table turn time, speed of service, item mix velocity).

### 1.2 The MENUIN Position: "Trustworthy Management Reporting"
The research team unanimously concludes that **MENUIN must not attempt to be a full General Ledger (GL) Accounting/ERP suite**. Instead, MENUIN should occupy the high-value layer of **Authoritative Operational & Storefront Management Reporting**, providing pristine transaction integrity, granular sales mix diagnostics, disciplined cash control, and automated accounting export/integration pipelines into dedicated platforms (e.g., Mekari Jurnal, Accurate Online, Xero).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        MENUIN CORE BOUNDARY                            │
│  ┌───────────────────────┐  ┌─────────────────┐  ┌──────────────────┐  │
│  │   POS & STOREFRONT    │  │ OPERATIONAL BI  │  │ MANAGEMENT SALES │  │
│  │  • Real-time Orders   │  │ • Table Turns   │  │ • Gross/Net Sales│  │
│  │  • Shifts & Drawer    │  │ • Peak Hours    │  │ • Promo Impact   │  │
│  │  • Multi-tender Pay   │  │ • Item Mix (BCG)│  │ • Channel Splits │  │
│  └───────────────────────┘  └─────────────────┘  └──────────────────┘  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Automated Sync / Clean CSV
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    EXTERNAL ACCOUNTING (OUT OF SCOPE)                  │
│  • Double-entry General Ledger  • Balance Sheet & Asset Depreciation    │
│  • Formal P&L with Rent/Payroll • Tax Filing (SPT Tahunan/Masa)        │
└────────────────────────────────────────────────────────────────────────┘
```

### 1.3 Key Strategic Recommendations
* **Two-Tiered COGS Strategy:** For the MVP, MENUIN supports **Theoretical Recipe Costing** clearly labeled as *"Estimasi Laba Kotor (Theoretical Gross Profit)"* with explicit disclaimers. Phase 2 introduces periodic inventory reconciliation `(Beginning + Purchases - Ending)` to calculate true **Actual COGS**.
* **Strict Revenue Hierarchy:** Standardize all reporting around the formula:
  $$\text{Gross Sales} - \text{Discounts} - \text{Refunds/Voids} = \text{Net Sales (Real Operating Revenue)}$$
  Taxes and Service Charges are tracked in a dedicated, isolated liability ledger.
* **Separation of Dashboards:** Establish a tri-split view:
  1. *Executive Dashboard:* Net Sales, Order Volume, AOV, Gross Margin %, Real-time Shift Cash.
  2. *Operational Dashboard:* Speed of service, active tables, kitchen queue, hourly throughput.
  3. *Financial Reconciliations:* Cash drawer variance, payment gateway settlement status, tax collection summary.

---

## 2. Research Methodology

To formulate an empirically grounded reporting architecture, the research team conducted systematic product benchmarking, regulatory verification, accounting standard cross-referencing, and workflow modeling.

### 2.1 Research Framework & Evidence Standards
Every statement and architectural recommendation is categorized according to four explicit evidence tags:
* `[FACT]`: Direct statutory provisions, tax laws, or validated mathematical formulas.
* `[INDUSTRY PRACTICE]`: Standard operational or software patterns confirmed across multiple enterprise POS and F&B operations.
* `[INFERENCE]`: Deductions drawn from synthesizing financial analysis, BI modeling, and F&B operational workflows.
* `[RECOMMENDATION]`: Specific product roadmap, architectural, or UX decisions formulated for MENUIN.

### 2.2 Benchmarked Products
The research team audited 13 enterprise and SMB systems across two distinct categories:

| Category | Products Audited | Geographic Focus | Key Capabilities Investigated |
| :--- | :--- | :--- | :--- |
| **F&B POS & Restaurant SaaS** | **Moka POS** (GoTo Financial)<br>**Majoo**<br>**Pawoon**<br>**Olsera**<br>**Toast POS**<br>**Square for Restaurants**<br>**Lightspeed Restaurant**<br>**Clover** | Indonesia & Southeast Asia<br>Indonesia<br>Indonesia<br>Indonesia<br>North America & Global<br>North America & Global<br>Europe & Global<br>North America | Shift closing, cash drawer drops, backoffice analytics, sales hierarchy, recipe deducting, modifier mix, multi-outlet aggregation, void audits. |
| **F&B Accounting & Financials** | **Accurate Online (AOL)**<br>**Jurnal by Mekari**<br>**Xero**<br>**QuickBooks Online**<br>**Zoho Books** | Indonesia<br>Indonesia<br>Global / ANZ<br>Global / US<br>Global / India | Chart of Accounts (CoA) mapping, FIFO/Average inventory valuation, PBJT tax liability booking, daily POS sales journal sync, financial statements (P&L, Balance Sheet, Cash Flow). |

### 2.3 Research Limitations
* **Proprietary Aggregator APIs:** Detailed settlement APIs for GrabFood, GoFood, and ShopeeFood vary by aggregator partnership tiers. Commission rates and payout deduction schedules are evaluated based on standard published merchant agreements (standard 20% + VAT on commission).
* **Local Tax Variation:** PBJT rates across Indonesia are set by regional bylaws (*Peraturan Daerah / Perda*). While UU No. 1/2022 sets the national ceiling at 10%, specific municipal deductions or exemption thresholds (e.g., DKI Jakarta micro-business threshold) require configurable system parameters.

---

## 3. F&B Reporting Landscape

F&B businesses operate on thin operating margins (typically 8% to 15% net profit in casual dining and 12% to 20% in quick-service beverages). In this industry, small operational oversights—such as unrecorded kitchen spoilage, excessive discount discounting, or cash till shrinkage—rapidly convert a paper profit into operational bankruptcy.

```
       TIME HORIZON                     REPORTING TIER                     PRIMARY USER
┌──────────────────────────┐    ┌───────────────────────────┐    ┌──────────────────────────────┐
│ Real-Time (Intraday)     │───▶│ Operational & Shift POS   │───▶│ Cashier, Head Chef, Manager  │
│ Daily / Weekly           │───▶│ Management Business Intel │───▶│ Outlet Manager, Multi-Unit Op│
│ Monthly / Quarterly      │───▶│ Financial & Tax Reporting │───▶│ Business Owner, Accountant   │
└──────────────────────────┘    └───────────────────────────┘    └──────────────────────────────┘
```

### 3.1 The Three Horizons of F&B Decision Making
1. **Intraday Operational Horizon (Minutes to Hours):**
   * *Focus:* Order pacing, kitchen bottle-necks, table turn times, cashier cash drawer levels, running out of stock (86'd items).
   * *Required Action:* Reallocating prep staff, approving voids, executing cash drops to safe.
2. **Short-Term Tactical Horizon (Days to Weeks):**
   * *Focus:* Shift labor scheduling vs. hourly traffic curves, promotional campaign effectiveness, menu item velocity (stars vs. dogs), inventory reorder triggers.
   * *Required Action:* Adjusting supplier purchase orders, modifying menu layout, retraining low-upselling staff.
3. **Strategic Financial Horizon (Monthly to Annually):**
   * *Focus:* Prime cost trends (COGS + Labor), store contribution margin, outlet ROI, capital expenditure planning for equipment replacement.
   * *Required Action:* Renegotiating ingredient vendor contracts, pruning unprofitable menu categories, evaluating lease agreements.

### 3.2 The Core Operational Friction Points
* **Cash-Drawer Blindness:** `[INDUSTRY PRACTICE]` In Indonesian cafes and casual dining, 30% to 50% of payments remain cash-based or direct QRIS settlements that settle across fragmented accounts. Cashiers frequently close shifts without structured blind count procedures, allowing till discrepancies to accumulate unrecorded.
* **Promo Cannibalization:** Merchants run aggressive percentage discounts (e.g., 30% off for store opening) without tracking whether gross sales increases translate into net margin growth or simply subsidize existing high-margin volume.
* **Modifier Blindness:** Toppings, syrup pumps, and milk substitutions carry high margins (up to 80%), yet standard POS reports bundle them into the parent item, concealing whether customers are customizing orders.

---

## 4. Competitor Research

A comprehensive audit of leading domestic and international systems reveals clear functional divisions between POS platforms and dedicated accounting software.

### 4.1 F&B POS / Restaurant Management Systems

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                             POS REPORTING FEATURE MATRIX                                    │
├────────────────────┬───────────┬───────────┬─────────────┬──────────────┬───────────────────┤
│ System             │ Net Sales │ Shift X/Z │ Recipe HPP  │ Menu Matrix  │ Multi-Store Rollup│
├────────────────────┼───────────┼───────────┼─────────────┼──────────────┼───────────────────┤
│ Toast POS          │ Excellent │ Automated │ Theoretical │ Advanced BI  │ Enterprise HQ     │
│ Square Restaurant  │ Excellent │ Manual/Auto│ Add-on      │ Basic Mix    │ Centralized Multi │
│ Lightspeed Rest.   │ Excellent │ Automated │ Advanced    │ Magic Quad   │ Multi-location    │
│ Clover             │ Standard  │ Till App  │ 3rd-party   │ Standard     │ Device-level      │
│ Moka POS           │ Good      │ Shift End │ Simple Ingr │ Basic Report │ Multi-outlet Pro  │
│ Majoo              │ Good      │ Shift Close│ Built-in   │ Best Seller  │ Multi-cabang      │
│ Pawoon             │ Standard  │ Rekap Kas │ Built-in    │ Simple Mix   │ Multi-outlet      │
│ Olsera             │ Standard  │ Daily Close│ Built-in   │ Simple Mix   │ Multi-cabang      │
└────────────────────┴───────────┴───────────┴─────────────┴──────────────┴───────────────────┤
```

#### 4.1.1 Toast POS
* `[FACT]` Toast separates **Gross Sales** (total value of all items at regular price before discounts or comps, excluding tax and tips) from **Net Sales** (Gross Sales minus discounts, comps, and refunds).
* `[FACT]` Toast features an executive **Sales Summary** report with drill-downs by Dining Option (Dine-In, Takeout, Delivery), Service Area (Patio, Bar, Dining Room), Revenue Centers, and Payment Summary.
* `[INDUSTRY PRACTICE]` Toast's shift reporting utilizes a strict **Z-Report** equivalent that audits cash drawers with expected cash calculations:
  $$\text{Expected Cash} = \text{Starting Bank} + \text{Cash Sales} + \text{Paid In} - \text{Paid Out}$$
* *Key Takeaway for MENUIN:* Toast's distinction between Gross Sales, Net Sales, and Total Collected is the global gold standard for avoiding accounting ambiguity.

#### 4.1.2 Square for Restaurants
* `[FACT]` Square's **Sales Summary** formats reports similarly to a top-level balance sheet: Gross Sales $\rightarrow$ Discounts/Comps $\rightarrow$ Refunds $\rightarrow$ Net Sales $\rightarrow$ Taxes $\rightarrow$ Tips $\rightarrow$ Total Collected.
* `[FACT]` Square emphasizes that **Total Collected does not equal Net Sales**, nor does it reflect bank deposits because payment processing fees (e.g., 2.6% + 10¢) are deducted prior to bank transfer.
* *Key Takeaway for MENUIN:* Square explicitly warns users that sales reports reflect *earned revenue*, while deposit reports reflect *cleared cash*. MENUIN must adopt this exact terminology to prevent payout disputes.

#### 4.1.3 Lightspeed Restaurant (Advanced Insights)
* `[FACT]` Lightspeed incorporates the **"Magic Menu Quadrant"** (Menu Engineering BCG Matrix), automatically plotting dishes across two axes: *Profitability* (Contribution Margin) vs. *Popularity* (Sales Volume), classifying items into Stars, Plowhorses, Puzzles, and Dogs.
* `[FACT]` Lightspeed provides server scorecards tracking Average Check per Server, Upsell Modifier Conversion, and Table Turn Speed.
* *Key Takeaway for MENUIN:* Advanced menu analytics provide vastly higher operational value to restaurant owners than pseudo-accounting balance sheets.

#### 4.1.4 Domestic Leaders: Moka POS, Majoo, Pawoon, Olsera
* `[FACT]` **Moka POS** Backoffice separates Gross Sales from Net Sales and features dedicated Shift Reports showing Employee Name, Start/End Time, Total Expected, Total Actual, and Cash Difference.
* `[FACT]` **Majoo** provides an automated HPP calculation linked to ingredient inventory, producing a basic gross profit report per product and category, with role-based masking to hide raw HPP figures from cashiers.
* `[FACT]` **Pawoon** integrates directly with Mekari Jurnal and Accurate Online, recognizing that deep accounting belongs in dedicated GL software.
* `[FACT]` **Olsera** incorporates manual expense tracking (*Pencatatan Biaya/Kas Masuk & Keluar*) at the till to generate a simplified operational income statement.
* *Key Takeaway for MENUIN:* The domestic market demands intuitive shift closing (rekap kas), clear gross-to-net sales reconciliation, role-based cost protection, and straightforward accounting export.

---

### 4.2 Accounting & Financial Management Systems

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          ACCOUNTING SYSTEM INTEGRATION MAPPING                              │
├────────────────────┬──────────────┬──────────────┬────────────────────────┬─────────────────┤
│ System             │ Inventory    │ Tax Handling │ POS Sync Mechanism     │ Financial Output│
├────────────────────┼──────────────┼──────────────┼────────────────────────┼─────────────────┤
│ Mekari Jurnal      │ Average/FIFO │ PBJT & PPN   │ Daily Summary / API    │ Full P&L, BS, CF│
│ Accurate Online    │ FIFO/Average │ PBJT & PPN   │ Accurate POS / Direct  │ 200+ Reports    │
│ Xero               │ Perpetual/Per│ GST/Sales Tax│ Daily Journal Entry    │ Standard IFRS   │
│ QuickBooks Online  │ FIFO/Average │ Sales Tax    │ App Store Sync (Toast) │ GAAP Statements │
└────────────────────┴──────────────┴──────────────┴────────────────────────┴─────────────────┤
```

#### 4.2.1 Mekari Jurnal & Accurate Online
* `[FACT]` In both Mekari Jurnal and Accurate Online, the standard integration pattern with a POS does **not** create a separate journal entry for every single cup of coffee sold.
* `[INDUSTRY PRACTICE]` Standard F&B bookkeeping syncs a **Daily Consolidated Sales Journal Entry**:
  * *Debit:* Cash on Hand / Cash in Drawer (Kas Kecil Kasir)
  * *Debit:* Merchant Clearing Accounts (Piutang EDC / QRIS Midtrans / GoFood Clearing)
  * *Debit:* Sales Discounts (Potongan Penjualan)
  * *Debit:* Payment Processing Fees (Beban Administrasi Bank / Merchant Fee)
  * *Credit:* Food & Beverage Sales Revenue (Pendapatan Penjualan)
  * *Credit:* PBJT / Pajak Restoran Payable (Hutang Pajak Daerah)
  * *Credit:* Service Charge Payable (Hutang Service Charge)
  * *Simultaneous Inventory Entry:* Debit COGS/HPP, Credit Inventory (Persediaan Bahan Baku).
* *Key Takeaway for MENUIN:* MENUIN's data architecture must natively structure daily totals into this exact format, allowing single-click export or automated webhook transmission to Jurnal and Accurate without manual data transformation.

---

## 5. F&B Business Questions

To prevent building vanity reports, every report and dashboard widget in MENUIN must directly answer a concrete operational or financial question faced by F&B operators.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                   F&B BUSINESS QUESTION MATRIX                                  │
├───────────┬─────────────────────────────────────────────────┬───────────────────────────────────┤
│ Cadence   │ Business Question                               │ Supporting MENUIN Report          │
├───────────┼─────────────────────────────────────────────────┼───────────────────────────────────┤
│ **Daily** │ 1. How much cash should be in the drawer right  │ Shift End Reconciliation (Z-Rep)  │
│           │    now, and is there a shortage?                │                                   │
│           │ 2. What were our net sales today vs. yesterday? │ Sales Summary KPI                 │
│           │ 3. Which dishes sold out or underperformed?     │ Product Sales & Stock Movement    │
│           │ 4. Were there unusual voids, comps, or refunds? │ Void & Cancellation Audit Log     │
│           │ 5. What were our peak rush hours?               │ Hourly Sales & Transaction Curve  │
├───────────┼─────────────────────────────────────────────────┼───────────────────────────────────┤
│ **Weekly**│ 1. Are ingredient costs trending within budget? │ Theoretical COGS & Margin Report  │
│           │ 2. Which menu items generate the highest total  │ Menu Engineering Matrix (BCG)     │
│           │    gross margin (not just sales volume)?        │                                   │
│           │ 3. Which days of the week require more staff?   │ Day-of-Week Sales & Labor Profile │
│           │ 4. Did the weekend promotional campaign yield   │ Promotion & Voucher ROI Report    │
│           │    incremental net sales or just give discounts?│                                   │
│           │ 5. How are dine-in vs. delivery channels moving?│ Sales by Order Type Report        │
├───────────┼─────────────────────────────────────────────────┼───────────────────────────────────┤
│ **Monthly**│ 1. What was the outlet's Store Contribution    │ Store-Level P&L Summary           │
│           │    Margin after direct operational expenses?    │                                   │
│           │ 2. How much PBJT tax must be remitted to Pemda? │ Tax & Service Charge Liability Rep│
│           │ 3. Which outlet generates the best capital ROI? │ Multi-Outlet Comparative Ranking  │
│           │ 4. Where is inventory leaking (actual vs cost)? │ Inventory Variance & Waste Report │
│           │ 5. What is our Average Order Value (AOV) trend? │ Long-term AOV & Basket Analysis   │
└───────────┴─────────────────────────────────────────────────┴───────────────────────────────────┘
```

---

## 6. Financial Reporting Concepts

F&B operators routinely conflate sales terminology with financial accounting. The table below delineates precise accounting definitions, mathematical formulas, data requirements, and POS suitability.

```
                  ┌───────────────────────────────┐
                  │          GROSS SALES          │
                  └───────────────┬───────────────┘
                                  │  [-] Discounts / Promos
                                  │  [-] Voids / Refunds
                                  ▼
                  ┌───────────────────────────────┐
                  │           NET SALES           │ ◄── Actual Operating Revenue
                  └───────────────┬───────────────┘
                                  │  [-] COGS / HPP (Food & Beverage Ingredients)
                                  ▼
                  ┌───────────────────────────────┐
                  │         GROSS PROFIT          │ ◄── Store Gross Margin
                  └───────────────┬───────────────┘
                                  │  [-] Direct Operating Expenses (OPEX)
                                  │      (Labor, Rent, Utilities, Platform Fees)
                                  ▼
                  ┌───────────────────────────────┐
                  │       OPERATING PROFIT        │ ◄── EBITDA / Store Contribution
                  └───────────────────────────────┘
```

### 6.1 Concept Analysis & Definitional Rigor

#### 1. Gross Sales (Penjualan Bruto)
* **Definition:** `[FACT]` The total aggregate face value of all goods and services billed to customers at standard catalog menu prices before any deductions.
* **Formula:** $\text{Gross Sales} = \sum (\text{Item Unit Price} \times \text{Item Sold Quantity}) + \sum (\text{Modifier Unit Price} \times \text{Modifier Quantity})$
* **Required Data:** Line-item transactional records, unit prices, sold quantities.
* **Business Purpose:** Measures gross top-line demand and catalog pricing capacity.
* **Potential Misunderstanding:** Mistaking Gross Sales for actual bankable cash. High Gross Sales with 40% discounts results in an optical illusion of growth.
* **POS vs. Accounting:** **Primary POS metric**. POS is the authoritative system of record for Gross Sales.

#### 2. Discounts & Vouchers (Potongan Harga & Promosi)
* **Definition:** `[FACT]` Reductions granted to customers from the standard catalog price, including promotional codes, loyalty vouchers, manager courtesy comps, and employee meals.
* **Formula:** $\text{Total Discounts} = \sum \text{Transaction-Level Discounts} + \sum \text{Item-Level Discounts}$
* **Required Data:** Promotion lookup tables, discount rules, audit-logged void/comp records.
* **Business Purpose:** Quantifies margin sacrifice made to acquire traffic or resolve customer complaints.
* **Potential Misunderstanding:** Treating promotional discounts as an operating expense rather than contra-revenue. In accounting (PSAK/IFRS 15), sales discounts directly reduce gross revenue to arrive at net revenue.
* **POS vs. Accounting:** **Primary POS metric**. POS must capture and categorize every discount reason.

#### 3. Refunds & Voids (Pengembalian Dana & Pembatalan Transaksi)
* **Definition:** `[FACT]` Reversals of completed or partially settled transactions due to customer dissatisfaction, order error, or unfulfillable kitchen tickets.
* **Formula:** $\text{Total Refunds} = \sum \text{Voided Settled Transactions} + \sum \text{Returned Line Items}$
* **Required Data:** Void timestamps, authorizing manager ID, cancellation reason code, returned stock indicator.
* **Business Purpose:** Essential loss prevention and operational quality indicator. Spike in voids indicates kitchen error, cashier fraud, or stockout.
* **Potential Misunderstanding:** Silently deleting records from the database instead of creating immutable reversal entries, destroying audit trails.
* **POS vs. Accounting:** **Primary POS metric**. POS must maintain immutable audit logs for all reversals.

#### 4. Net Sales (Penjualan Bersih)
* **Definition:** `[FACT]` The true top-line operating revenue earned by the restaurant from core food and beverage operations.
* **Formula:** $\text{Net Sales} = \text{Gross Sales} - \text{Discounts} - \text{Refunds/Voids}$
* **Required Data:** Gross sales, discount ledger, refund ledger.
* **Business Purpose:** The foundational revenue metric upon which all operational ratios (COGS %, Labor %, Rent %) are benchmarked.
* **Potential Misunderstanding:** Mixing taxes (PBJT) or service charges into Net Sales. Net sales must strictly exclude all pass-through collections.
* **POS vs. Accounting:** **Core Shared Metric**. POS calculates it; accounting records it as core operational revenue.

#### 5. Taxes (PBJT Makanan dan Minuman / Pajak Restoran / PB1)
* **Definition:** `[FACT]` A municipal consumption tax imposed under UU No. 1/2022 (HKPD) collected by the dining establishment on behalf of the local municipal government (*Pemerintah Daerah*).
* **Formula:**
  $$\text{DPP (Dasar Pengenaan Pajak)} = \text{Net Sales} + \text{Service Charge}$$
  $$\text{PBJT} = \text{DPP} \times \text{Tax Rate (e.g., 10\%)}$$
* **Required Data:** Net sales, taxable service charge amount, regional tax rate configuration.
* **Business Purpose:** Ensures legal compliance and accurate tax remittance to local revenue agencies (*Bapenda*).
* **Potential Misunderstanding:** Treating collected tax as business revenue. It is a pure **balance sheet liability** (`Hutang Pajak`). Spending collected tax leads to cash crises during monthly tax filing.
* **POS vs. Accounting:** **POS records collection; Accounting handles reconciliation and remittance**.

#### 6. Service Charge
* **Definition:** `[FACT]` A designated fee added to the customer's bill in casual and fine dining establishments, legally intended to be pooled and distributed to employees or utilized for service operational expenses.
* **Formula:** $\text{Service Charge} = \text{Net Sales} \times \text{Service Charge Rate (e.g., 5\% - 7\%)}$
* **Required Data:** Order dining type (often dine-in only), service charge rate.
* **Business Purpose:** Standardized gratuity distribution and staff retention mechanism.
* **Potential Misunderstanding:** Believing service charge is free owner profit. It carries payroll liabilities and is subject to PBJT taxation under Indonesian tax doctrine.
* **POS vs. Accounting:** **POS records collection; Accounting records as liability/payroll pool**.

#### 7. Cost of Goods Sold (COGS) / Harga Pokok Penjualan (HPP)
* **Definition:** `[FACT]` The direct cost of ingredients, raw materials, and packaging consumables directly expended to produce the food and beverage items sold.
* **Formula:**
  * *Theoretical COGS:* $\sum (\text{Sold Quantity} \times \text{Standard Recipe Ingredient Cost})$
  * *Actual COGS (Periodic Accounting Formula):*
    $$\text{Actual COGS} = \text{Beginning Inventory} + \text{Purchases} - \text{Ending Inventory}$$
* **Required Data:** Ingredient purchase costs, standardized recipe bills of material, physical stock count records.
* **Business Purpose:** Measures culinary efficiency, recipe cost control, and kitchen yield management.
* **Potential Misunderstanding:** Believing POS recipe multiplication reflects real kitchen costs. It excludes waste, burnt dishes, over-portioning, and theft.
* **POS vs. Accounting:** **POS provides Theoretical COGS; Accounting / Inventory System computes Actual COGS**.

#### 8. Gross Profit (Laba Kotor)
* **Definition:** `[FACT]` The residual earnings remaining from Net Sales after deducting the direct Cost of Goods Sold.
* **Formula:** $\text{Gross Profit} = \text{Net Sales} - \text{COGS}$
* **Business Purpose:** Represents the pool of capital available to cover labor, rent, marketing, utilities, and yield net return.
* **Potential Misunderstanding:** Believing a 70% gross profit means the restaurant is wealthy. Labor and rent routinely consume 45% to 55% of net sales.
* **POS vs. Accounting:** **POS calculates Theoretical Gross Profit; Accounting calculates Official Accounting Gross Profit**.

#### 9. Operating Expenses (OPEX / Biaya Operasional)
* **Definition:** `[FACT]` Non-ingredient expenditures required to run the establishment, including staff wages, lease/rent, electricity, gas, internet, marketing, and aggregator delivery commissions.
* **Business Purpose:** Measures operational overhead control.
* **POS vs. Accounting:** **Strictly Accounting Domain**, with the sole exception of *Direct Petty Cash Out* recorded at the cash till (e.g., emergency ice purchase).

#### 10. Net Profit (Laba Bersih) & Cash Flow
* **Definition:** `[FACT]` Bottom-line residual earnings after all operating expenses, financing costs, depreciation, and corporate income taxes. Cash Flow reflects actual physical cash timing.
* **Formula:** $\text{Net Profit} = \text{Gross Profit} - \text{OPEX} - \text{Depreciation} - \text{Interest} - \text{Corporate Tax}$
* **POS vs. Accounting:** **Strictly Accounting / ERP Domain**. A POS system cannot compute true Net Profit because it lacks visibility into depreciation schedules, off-premise payroll, landlord amortization, and interest liabilities.

---

## 7. HPP / COGS & Profitability Deep Dive

The calculation of COGS (Harga Pokok Penjualan) is the most contentious area in F&B management software. Presenting inaccurate profit metrics directly endangers restaurant survival.

```
        THEORETICAL COGS                              ACTUAL COGS (INVENTORY)
 ┌─────────────────────────────┐              ┌─────────────────────────────────────┐
 │  Menu Recipes (BOM)         │              │  Beginning Stock Value              │
 │  [×] Units Sold at POS      │              │  [+] New Purchases Received         │
 │                             │              │  [-] Ending Physical Count Value    │
 └──────────────┬──────────────┘              └──────────────────┬──────────────────┘
                │                                                │
                └───────────────────────┬────────────────────────┘
                                        │
                                        ▼
                        FOOD COST VARIANCE (THE LEAKAGE GAP)
                        • Over-portioning (Heavy hands)
                        • Kitchen Spoilage & Expired Goods
                        • Burnt / Remade Unrecorded Orders
                        • Internal Theft / Pilferage
```

### 7.1 Theoretical vs. Actual COGS Mechanics
1. **Theoretical COGS (Recipe-Driven):**
   * *Mechanism:* Every menu item is mapped to a Bill of Materials (BOM). When a cashier rings up 100 cups of Latte, the POS multiplies 100 by the static unit cost of milk (200ml $\times$ Rp30/ml = Rp6,000), espresso beans (18g $\times$ Rp350/g = Rp6,300), and cup/lid (Rp1,200), yielding Rp13,500 $\times$ 100 = Rp1,350,000.
   * *Assumption:* Perfect zero-waste world, exact scale measurements, no milk pitcher spillage, no dropped cups.
2. **Actual COGS (Inventory-Driven):**
   * *Mechanism:* At the end of the week, the manager counts physical inventory. Beginning milk was 20 liters (Rp600,000), purchases were 100 liters (Rp3,000,000), ending count is 8 liters (Rp240,000). Actual milk consumed = Rp3,360,000.
3. **The Variance Gap (Variance = Actual - Theoretical):**
   * `[INDUSTRY PRACTICE]` In healthy restaurant operations, Food Cost Variance must remain below **2% to 3%**. When variance exceeds **5%**, systemic operational breakdown exists (uncalibrated grinders, line cook over-portioning, waste dumped without logging, or employee theft).

### 7.2 The Minimum Data Threshold for Trustworthy Profitability
When can MENUIN responsibly show profit numbers?

```
Level 0: No Cost Data Entered
         └── ACTION: POS MUST HIDE ALL PROFIT METRICS. Show only Sales & Orders.

Level 1: Static Unit Cost on Products (Product Catalog `cost_price`)
         └── ACTION: POS displays "Estimasi Margin Kotor (Theoretical Gross Margin)".
         └── MANDATORY UI BADGE: "Estimasi berdasarkan modal dasar produk (belum termasuk waste/operasional)".

Level 2: Ingredient-Level Recipe Costing (BOM & Modifiers)
         └── ACTION: POS displays "Laba Kotor Resep (Recipe-Based Gross Profit)".
         └── Modifiers dynamically add cost (e.g., Oat Milk +Rp8,000 adds Rp4,500 cost).

Level 3: Full Inventory & Stock Count (Beginning + Purchases - Ending)
         └── ACTION: POS / Backoffice displays "Laba Kotor Aktual (Actual Gross Profit)".
         └── Food Cost Variance is explicitly highlighted.
```

### 7.3 When is it Unsafe or Misleading for a POS to Present "Profit"?
`[RECOMMENDATION]` MENUIN must adhere to the following **Safety Guardrails**:
1. **Never Label Operational Gross Profit as "Laba Bersih (Net Profit)":** Displaying $(Sales - Cost) = Laba Bersih$ on a POS dashboard is professional negligence. It deceives the owner into believing rent, barista salaries, electricity, and aggregator fees have already been accounted for.
2. **Never Calculate Margin on Tax-Inclusive Amounts:** If a dish sells for Rp55,000 (Rp50,000 net + Rp5,000 PBJT), margin must be calculated against Rp50,000. Calculating $\frac{55,000 - 20,000}{55,000} = 63.6\%$ inflates true margin (which is $\frac{50,000 - 20,000}{50,000} = 60.0\%$).
3. **The Modifier Blindness Hazard:** If a customer orders an Americano (Cost: Rp4,000, Price: Rp20,000) and adds Vanilla Syrup (Cost: Rp2,500, Price: Rp5,000), failing to track modifier cost understates COGS by 38% on that transaction.

---

## 8. F&B KPI Research

The research team has cataloged and standardized the core Key Performance Indicators (KPIs) essential for modern F&B operations.

---

### KPI 1: Net Sales (Penjualan Bersih)
* **Definition:** Total operating sales revenue generated from core food and beverage transactions after deducting all promotional discounts, vouchers, comps, and refunded items, excluding taxes and service charges.
* **Formula:**
  $$\text{Net Sales} = \text{Gross Sales} - \text{Discounts} - \text{Refunds/Voids}$$
* **Business Question:** What is the actual top-line revenue earned by the restaurant to fund its operations?
* **Required Data:** Transaction item subtotals, item discounts, transaction-level discounts, refund ledger.
* **Why It Matters:** Industry benchmark denominator for prime cost, rent affordability, and historical store growth.
* **Potential Misinterpretation:** Including tax or tips in Net Sales, artificially inflating operational performance.
* **Recommended Usage:** Primary top-line metric displayed prominently on Executive Dashboard and store recap summaries.

---

### KPI 2: Average Order Value (AOV / Nilai Rata-rata Transaksi)
* **Definition:** The average net revenue generated per completed sales transaction.
* **Formula:**
  $$\text{AOV} = \frac{\text{Net Sales}}{\text{Total Completed Transactions}}$$
* **Business Question:** How much does an average customer or dining party spend per visit?
* **Required Data:** Net Sales, completed transaction count.
* **Why It Matters:** Identifies upselling effectiveness, menu bundling success, and table spend optimization.
* **Potential Misinterpretation:** Comparing AOV across different order channels without segmentation (e.g., Dine-in party of 4 has Rp250,000 AOV, while single Takeaway coffee has Rp35,000 AOV).
* **Recommended Usage:** Display as an executive summary KPI, segmented by order type (Dine-In vs. Takeout vs. Delivery).

---

### KPI 3: Theoretical Gross Margin % (Persentase Margin Kotor Teoretis)
* **Definition:** The percentage of net sales remaining after subtracting the standard theoretical recipe cost of goods sold.
* **Formula:**
  $$\text{Theoretical Gross Margin \%} = \left(\frac{\text{Net Sales} - \text{Theoretical COGS}}{\text{Net Sales}}\right) \times 100\%$$
* **Business Question:** What percentage of our sales revenue remains to cover labor, rent, and overhead after food costs?
* **Required Data:** Net sales, product catalog unit costs (`cost_price`) or recipe ingredient sums.
* **Why It Matters:** Gauges catalog pricing health. F&B healthy benchmarks: 65% – 72% for casual dining, 70% – 82% for beverage/coffee.
* **Potential Misinterpretation:** Assuming this is actual realized profit without factoring in waste, shrinkage, or staff meals.
* **Recommended Usage:** Track weekly on Management Dashboard; trigger alerts if margin drops below concept threshold (e.g., < 65%).

---

### KPI 4: Prime Cost % (Rasio Biaya Utama)
* **Definition:** `[FACT]` The combined ratio of Cost of Goods Sold and Total Labor Costs relative to Net Sales.
* **Formula:**
  $$\text{Prime Cost \%} = \left(\frac{\text{Actual COGS} + \text{Total Labor Cost}}{\text{Net Sales}}\right) \times 100\%$$
* **Business Question:** Are our two largest controllable costs within sustainable operational boundaries?
* **Required Data:** COGS (from inventory or theoretical), total wages, payroll taxes, service charge allocations, Net Sales.
* **Why It Matters:** The single most reliable predictor of F&B business survival. Standard target benchmark: **55% – 62%**.
* **Potential Misinterpretation:** Calculating Prime Cost on a cash basis rather than accrual basis, causing massive artificial spikes on bi-weekly payroll days.
* **Recommended Usage:** Executive Monthly Review (Phase 2 capability once labor scheduling or external expense sync is active).

---

### KPI 5: Cash Drawer Variance (Selisih Kas Laci Kasir)
* **Definition:** The mathematical variance between physical cash counted in the till at shift close versus expected cash recorded by the POS.
* **Formula:**
  $$\text{Variance} = \text{Actual Physical Cash Count} - \text{Expected Cash}$$
  $$\text{Expected Cash} = \text{Starting Float} + \text{Cash Sales} + \text{Cash In (Drops)} - \text{Cash Out (Paid Out)}$$
* **Business Question:** Did the cashier balance the till accurately, or is money missing/unaccounted for?
* **Required Data:** Shift start float, transaction cash tender sums, cash movement logs, blind close count.
* **Why It Matters:** Primary internal control against employee theft, incorrect change giving, and till mismanagement.
* **Potential Misinterpretation:** Attributing recurring negative variances to "rounding errors" rather than investigating theft or training gaps.
* **Recommended Usage:** Mandatory Z-Report component at every shift close; flagged in red on Store Manager dashboard if variance $\neq 0$.

---

### KPI 6: Discount Rate % (Rasio Diskon terhadap Penjualan)
* **Definition:** The proportion of gross menu revenue sacrificed in the form of price reductions, vouchers, and promotional deals.
* **Formula:**
  $$\text{Discount Rate \%} = \left(\frac{\text{Total Discounts}}{\text{Gross Sales}}\right) \times 100\%$$
* **Business Question:** Are we discounting too heavily to drive volume, eroding our underlying gross profit?
* **Required Data:** Total discount sum, Gross Sales.
* **Why It Matters:** Protects brand equity and margin. A healthy F&B operation typically maintains discounts between **3% and 8%** of Gross Sales. Above 15% indicates dangerous promo addiction.
* **Potential Misinterpretation:** Viewing high sales growth without noticing that discount rate grew faster, resulting in lower total gross profit rupiah.
* **Recommended Usage:** Trend line chart in Marketing & Promotion Reports.

---

### KPI 7: Table Turnover Rate (Tingkat Perputaran Meja)
* **Definition:** The number of distinct dining parties served per table over a defined operational shift or day.
* **Formula:**
  $$\text{Table Turnover} = \frac{\text{Total Completed Dine-In Table Parties}}{\text{Total Available Dining Tables}}$$
* **Business Question:** How efficiently are we utilizing dining room seating capacity during rush hours?
* **Required Data:** Table identifier, order open timestamp, order payment timestamp, active table count.
* **Why It Matters:** Key capacity driver for dine-in concepts. Moving turn time from 60 minutes to 45 minutes increases peak revenue by 33%.
* **Potential Misinterpretation:** Pushing for high turns at the expense of hospitality, causing customer dissatisfaction.
* **Recommended Usage:** Operational Dine-In Analytics dashboard.

---

### KPI 8: Void / Cancellation Rate % (Rasio Pembatalan Pesanan)
* **Definition:** The percentage of items or orders cancelled after being entered into the POS system or sent to the kitchen.
* **Formula:**
  $$\text{Void Rate \%} = \left(\frac{\text{Total Voided Item Value}}{\text{Gross Sales} + \text{Total Voided Item Value}}\right) \times 100\%$$
* **Business Question:** How often are mistakes made in order entry or kitchen preparation?
* **Required Data:** Transaction item status, void flag, item price, void reason code.
* **Why It Matters:** High void rates indicate kitchen errors, training deficiencies, or cashier theft schemes (ringing orders, pocketing cash, and voiding tickets).
* **Potential Misinterpretation:** Treating post-kitchen food waste voids identically to pre-kitchen accidental button taps.
* **Recommended Usage:** Loss Prevention & Audit Dashboard; immediate notification triggered to Owner when void rate exceeds 2%.

---

## 9. Dashboard Information Architecture

MENUIN's reporting UI must follow a strict hierarchy that serves distinct cognitive needs at different operational moments.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MENUIN DASHBOARD ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  PERSISTENT TOP CONTROL: [ Outlet Selector (All / Outlet A / B) ]  [ Date Range Preset ]     │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 1: EXECUTIVE PULSE CARDS (High-level summary metrics with comparative % delta)        │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ ┌───────────────────────────┐  │
│  │   Net Sales     │ │   Transactions  │ │   Avg Order Val │ │ Theoretical Gross Margin  │  │
│  │ Rp 14.850.000   │ │       342       │ │   Rp 43.421     │ │      68.4% (Rp10.150k)    │  │
│  │  ▲ +12% vs lw   │ │   ▲ +8% vs lw   │ │   ▲ +3% vs lw   │ │     ▲ +1.2% vs lw         │  │
│  └─────────────────┘ └─────────────────┘ └─────────────────┘ └───────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 2: VISUAL ANALYTIC GRAPHS (Dynamic distribution and hourly pacing)                     │
│  ┌───────────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ Sales & Transaction Curve (Hourly / Daily)    │ │ Channel & Payment Mix               │  │
│  │ [ Bar: Net Sales | Line: Ticket Volume ]      │ │ [ Donut: Dine-In / Take / Delivery ]│  │
│  └───────────────────────────────────────────────┘ └─────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  TIER 3: OPERATIONAL ACTION BOARDS (Tactical decision support)                               │
│  ┌───────────────────────────────────────────────┐ ┌─────────────────────────────────────┐  │
│  │ Top Performing Items by Revenue & Velocity    │ │ Operational Alerts & Discrepancies  │  │
│  │ 1. Kopi Susu Aren (412 cups - Rp8.2M)         │ │ • Active Shift Shortage: -Rp45.000  │  │
│  │ 2. Mie Goreng Spesial (180 ptn - Rp4.5M)      │ │ • 3 Voided Orders (Rp115.000)       │  │
│  │ 3. Croissant Butter (95 pcs - Rp2.8M)         │ │ • 2 Items Low Stock (< Min Level)   │  │
│  └───────────────────────────────────────────────┘ └─────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 9.1 Dashboard Classification
1. **Executive Dashboard (The "How are we doing?" View):**
   * *Target User:* Business Owner, General Manager.
   * *Primary Metrics:* Net Sales, Total Orders, Average Order Value (AOV), Estimated Gross Margin, Multi-Outlet Consolidated Rollup.
   * *Visuals:* Trend lines vs. previous period (day-on-day, week-on-week, month-on-month).
2. **Operational Dashboard (The "What is happening now?" View):**
   * *Target User:* Store Manager, Head Cashier, Supervisor.
   * *Primary Metrics:* Current Active Shift Duration, Live Drawer Cash, Table Occupancy Rate, Kitchen Open Tickets, Hourly Order Pacing.
   * *Visuals:* Real-time gauges, live order queue counters.
3. **Financial & Reconciliation Dashboard (The "Is the money safe?" View):**
   * *Target User:* Finance / Bookkeeper, Owner.
   * *Primary Metrics:* Total Collected Cash, Digital Clearing Pipeline (Midtrans QRIS, ShopeePay, EDC), Shift Cash Discrepancies, PBJT Tax Accrual, Platform Aggregator Deductions.
   * *Visuals:* Detailed tabular reconciliations with export buttons (CSV, Excel, PDF).

---

## 10. Operational Reporting Architecture

Operational reports capture the physical mechanics of the restaurant, providing managers with the tools to eliminate friction and control floor costs.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                               OPERATIONAL REPORTS TAXONOMY                                  │
├───────────────────────┬───────────────────────────────────┬─────────────────────────────────┤
│ Report Name           │ Core Dimensions & Metrics         │ Primary Operational Purpose     │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Shift End (Z-Rep)** │ Shift ID, Cashier, Start/End,     │ Daily cash governance, drawer   │
│                       │ Opening Float, Cash Sales, Cash   │ accountability, preventing till │
│                       │ Movements, Expected vs Actual Cash│ leakage at staff handoff.       │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Cash Movement Log** │ Timestamp, Shift ID, Type (In/Out)│ Audit trail of cash removals    │
│                       │ Amount, Authorizing Staff, Reason │ for petty cash (e.g., ice) or   │
│                       │ (e.g., Safe Drop, Petty Expense)  │ cash additions from the safe.   │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Hourly Traffic &**  │ Hour of Day, Order Count, Net     │ Labor scheduling optimization,  │
│ **Rush Analysis**     │ Sales, Items per Ticket, AOV      │ kitchen prep planning, opening  │
│                       │                                   │ hour adjustments.               │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Void, Comp &**      │ Void Timestamp, Order #, Item,    │ Loss prevention, identifying    │
│ **Return Audit Log**  │ Value, Reason Code, Cashier ID,   │ kitchen prep errors, detecting  │
│                       │ Authorizing Manager ID            │ unauthorized manager overrides. │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Table & Seating**   │ Table #, Occupancy Duration,      │ Dining room efficiency, turn    │
│ **Turn Report**       │ Party Size, Spend per Seat (RevPASH│ time optimization, layout       │
│                       │ Seat Turnover Rate                │ capacity analysis.              │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Cashier Performance│ Cashier Name, Total Orders Billed,│ Employee coaching, balancing    │
│ **Scorecard**         │ Avg Speed of Service, Total Net   │ register workload, detecting    │
│                       │ Sales, Cash Variance Frequency    │ till discrepancy patterns.      │
└───────────────────────┴───────────────────────────────────┴─────────────────────────────────┘
```

---

## 11. Sales Reporting Architecture

Sales reporting is MENUIN's core engine, answering what is selling, through which channels, and how discounts impact realization.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  SALES REPORTS TAXONOMY                                     │
├───────────────────────┬───────────────────────────────────┬─────────────────────────────────┤
│ Report Name           │ Core Dimensions & Metrics         │ Business Decision Supported     │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Sales Summary**     │ Gross Sales, Discounts, Refunds,  │ High-level top-line performance │
│                       │ Net Sales, Tax, Service Charge,   │ tracking; standard period-over- │
│                       │ Grand Total, Order Count, AOV     │ period benchmarking.            │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Product Sales**     │ SKU, Product Name, Category, Sold │ Menu curation, recipe inventory │
│ **Performance**       │ Qty, Gross Revenue, Discount Share│ forecasting, identifying anchor │
│                       │ Net Revenue, Estimated Margin %   │ products driving store volume.  │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Category Sales**    │ Category Name, Qty Sold, Share %  │ Category mix balance (Food vs.  │
│ **Breakdown**         │ Net Sales, Margin Contribution    │ Beverage vs. Retail merchandise)│
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Modifier & Add-on** │ Modifier Group, Modifier Option,  │ High-margin upselling strategy, │
│ **Attachment Report** │ Attachment Frequency, Attach %,   │ optimizing default recipes,     │
│                       │ Additional Revenue Generated      │ evaluating topping popularity.  │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Channel / Dining**  │ Order Type (Dine-In, Takeaway,    │ Packaging purchasing, delivery  │
│ **Option Breakdown**  │ In-House Delivery, Grab/GoFood),  │ aggregator dependency tracking, │
│                       │ Volume %, Net Sales, Avg Ticket   │ floor vs. takeout resource split│
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Payment Tender &**  │ Payment Method (Cash, QRIS, EDC,  │ Bank reconciliation, merchant   │
│ **Gateway Split**     │ Transfer), Provider (Midtrans),   │ discount rate (MDR) impact,     │
│                       │ Gross Collected, Fees Deducted    │ cash handling logistics.        │
├───────────────────────┼───────────────────────────────────┼─────────────────────────────────┤
│ **Promotion & Promo** │ Promo Code, Promotion Name, Times │ Promotional ROI evaluation,     │
│ **Code ROI Report**   │ Redeemed, Total Discount Value,   │ discount abuse detection, promo │
│                       │ Net Sales Generated, Uplift Ratio │ margin sacrifice monitoring.    │
└───────────────────────┴───────────────────────────────────┴─────────────────────────────────┘
```

---

## 12. Financial Reporting Architecture

MENUIN must strictly delineate operational revenue from statutory pass-through liabilities and channel commission deductions.

```
                        GROSS TRANSACTION SUMMARY (WHAT CUSTOMER PAID)
                                       Rp 115.500
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                │                                                     │
                ▼                                                     ▼
     STATUTORY PASS-THROUGHS                               REAL OPERATING REVENUE
     (BALANCE SHEET LIABILITIES)                           (STORE EARNED SALES)
     • PBJT Tax (10%):  Rp 10.000                          • Net Sales:  Rp 100.000
     • Service (5%):    Rp  5.500                            (Gross Rp110k - Disc Rp10k)
     • Total Liability: Rp 15.500
                │                                                     │
                └──────────────────────────┬──────────────────────────┘
                                           │
                                           ▼
                               TOTAL COLLECTED FUNDS
                                     Rp 115.500
                                           │
                ┌──────────────────────────┴──────────────────────────┐
                ▼                                                     ▼
      CASH IN REGISTER TILL                                CLEARING GATEWAY RECEIVABLE
           (Rp 50.000)                                      (Midtrans QRIS: Rp 65.500)
                                                             [-] Gateway Fee (0.7%): Rp 458
                                                             [=] Net Cleared: Rp 65.042
```

### 12.1 The Three Essential Financial Reconciliations
1. **Tax & Service Charge Accrual Report:**
   * Summarizes monthly tax collection for municipal Bapenda declaration.
   * Shows `Net Sales`, `Taxable Service Charge`, `Total DPP`, `Calculated PBJT (10%)`, and `Exempt Sales`.
2. **Payment Gateway & Merchant Payout Clearing Report:**
   * Tracks funds in transit from digital payment providers (e.g., Midtrans QRIS, ShopeePay).
   * Identifies gross authorized payments vs. net bank settlement after MDR (Merchant Discount Rate, e.g., 0.7% on QRIS).
3. **Delivery Aggregator Commission Reconciliation:**
   * For orders originating from food delivery platforms, segregates Gross Menu Price from Platform Commission Expense (e.g., 20%) to show the **Net Merchant Settlement Receivable**.

---

## 13. Multi-Outlet Reporting Architecture

Multi-outlet F&B brands face unique operational challenges: inconsistent product mix, disparate cashier discipline, and difficulty pinpointing which location drives true brand profitability.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          MULTI-OUTLET CONSOLIDATED ARCHITECTURE                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  LEVEL 1: CONSOLIDATED BRAND OVERVIEW (HQ VIEW)                                             │
│  • Total Enterprise Net Sales (Consolidated across all active branches)                     │
│  • Total Enterprise Orders & Blended Enterprise AOV                                         │
│  • Top Performing Outlets by Revenue Contribution %                                         │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  LEVEL 2: COMPARATIVE OUTLET LEADERBOARD & BENCHMARKING                                     │
│  ┌──────────────────┬──────────────┬──────────────┬──────────────┬───────────────────────┐  │
│  │ Outlet Name      │ Net Sales    │ Orders / Day │ AOV          │ Cash Variance Rate    │  │
│  ├──────────────────┼──────────────┼──────────────┼──────────────┼───────────────────────┤  │
│  │ Cabang Senopati  │ Rp 45.2M (42%)│ 410          │ Rp 110.240   │ 0.02% (Healthy)       │  │
│  │ Cabang Bintaro   │ Rp 38.1M (35%)│ 520          │ Rp  73.260   │ 0.15% (Investigate)   │  │
│  │ Cabang Kemang    │ Rp 24.8M (23%)│ 280          │ Rp  88.570   │ 0.85% (High Leakage!) │  │
│  └──────────────────┴──────────────┴──────────────┴──────────────┴───────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  LEVEL 3: CROSS-OUTLET MENU VELOCITY & REPERTOIRE                                           │
│  • Identify catalog mismatches (e.g., Dish A generates 40% of sales in Bintaro, 5% in Kemang)│
│  • Regional pricing variance audit (validating branch-specific price overrides)              │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 13.1 Consolidated vs. Outlet-Specific Metrics
* `[RECOMMENDATION]` **Consolidate at HQ Level:** Net Sales, Total Orders, Promo Discount Burn, Overall Payment Mix, and Central Warehouse Inventory Transfers.
* `[RECOMMENDATION]` **Keep Strict Separation by Outlet:** Cash Drawer Over/Short, Speed of Service, Table Turns, Void/Comp Audits, and Shift Reconciliations. Consolidating cash drawer variances across outlets obscures cashier theft.

---

## 14. User Roles & Permission Model

Financial data must be carefully partitioned. Exposing raw supplier costs to line cashiers or hiding shift cash variances from owners compromises business security.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                  ROLE PERMISSION MATRIX                                     │
├─────────────────────────────────┬──────────┬──────────┬───────────┬─────────────┬───────────┤
│ Report / Data Surface           │ Owner    │ GM / Ops │ Store Mgr │ Head Cashier│ Cashier   │
├─────────────────────────────────┼──────────┼──────────┼───────────┼─────────────┼───────────┤
│ **Consolidated Brand Dashboard**│ Full     │ Full     │ No Access │ No Access   │ No Access │
│ **Single Outlet Sales Summary** │ Full     │ Full     │ Full      │ Read Only   │ Shift Only│
│ **Theoretical COGS & Margins**  │ Full     │ Full     │ Restricted│ No Access   │ No Access │
│ **Raw Ingredient Costs (BOM)**  │ Full     │ Full     │ No Access │ No Access   │ No Access │
│ **Shift End (Z-Report) History**│ Full     │ Full     │ Full      │ Full        │ Own Shift │
│ **Cash Drawer Discrepancy Logs**│ Full     │ Full     │ Full      │ View Only   │ Blind Cls │
│ **Void, Comp & Audit Trail**    │ Full     │ Full     │ Full      │ View Only   │ No Access │
│ **Tax Accrual & Remittance**    │ Full     │ Full     │ View Only │ No Access   │ No Access │
│ **Accounting Sync / CSV Export**│ Full     │ Full     │ No Access │ No Access   │ No Access │
└─────────────────────────────────┴──────────┴──────────┴───────────┴─────────────┴───────────┘
```

### 14.1 The Blind Shift Close Principle
* `[INDUSTRY PRACTICE]` **Strict Blind Close Security:** When a cashier closes a shift, the POS screen **must NOT display expected cash** prior to the cashier entering the physical cash count.
* *Rationale:* If the screen displays *"Expected Cash: Rp1,450,000"*, a dishonest cashier who counted Rp1,500,000 will pocket the Rp50,000 surplus; conversely, if the till is short, they may manipulate other numbers. The system must prompt for the manual count, seal the shift record, and only then reveal the variance to the store manager.

---

## 15. Data Dependency Matrix

To ensure architectural integrity, every report recommended for MENUIN is mapped directly to its underlying transactional schema requirements.

```
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                            DATA DEPENDENCY MATRIX                                                      │
├──────────────────────────┬──────────────────────────────┬────────────────────────┬─────────────────────────────────────┤
│ Report Name              │ Required Schema Fields       │ Data Source Table      │ Missing Data Failure Mode           │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Sales Summary**        │ `total_amount`, `discount`,  │ `transactions`         │ If discounts aren't recorded per tx,│
│                          │ `tax`, `service_charge`,     │                        │ Net Sales will equal Gross Sales,   │
│                          │ `status='COMPLETED'`         │                        │ overstating real revenue.           │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Product Performance**  │ `product_id`, `quantity`,    │ `transaction_items`,   │ If deleted products lack soft-delete│
│                          │ `price`, `subtotal`,         │ `products`,            │ historical records break or display │
│                          │ `cost_price`                 │ `categories`           │ "Unknown Item".                     │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Modifier Analytics**   │ `modifiers` (JSONB) or       │ `transaction_items`,   │ If modifiers are bundled in item    │
│                          │ normalized modifier table,   │ `modifiers`,           │ notes, add-on revenue cannot be     │
│                          │ `price`, `quantity`          │ `modifier_groups`      │ queried or calculated.              │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Shift End (Z-Report)** │ `starting_cash`, `actual_`,  │ `shifts`,              │ Without structured shift sessions,  │
│                          │ `expected_cash`, `status`,   │ `cash_movements`,      │ cash accountability breaks down     │
│                          │ `membership_id`, timestamps  │ `transactions`         │ completely.                         │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Void Audit Report**    │ `void_reason`, `voided_at`,  │ `transactions`,        │ Hard-deleting rows destroys audit   │
│                          │ `voided_by_membership_id`,  │ `audit_logs`           │ capabilities; requires explicit     │
│                          │ `status='VOIDED'`            │                        │ cancellation timestamps and actors. │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Tax Accrual Report**   │ `tax`, `service_charge`,     │ `transactions`,        │ Flat tax calculation fails if items │
│                          │ `pos_tax_rate`,              │ `tenants`              │ have mixed tax exempt rules         │
│                          │ `service_charge_rate`        │                        │ (standardize to taxable DPP).       │
├──────────────────────────┼──────────────────────────────┼────────────────────────┼─────────────────────────────────────┤
│ **Theoretical COGS**     │ `products.cost_price` or     │ `products`,            │ If cost_price is 0 or NULL, system  │
│                          │ recipe ingredients,          │ `recipes` (Future),    │ displays misleading 100% gross      │
│                          │ `transaction_items.quantity` │ `transaction_items`    │ margins (requires UI cost warning). │
└──────────────────────────┴──────────────────────────────┴────────────────────────┴─────────────────────────────────────┘
```

---

## 16. MENUIN Reporting Architecture & Navigation Tree

The recommended information architecture (IA) for MENUIN provides an intuitive, uncluttered backoffice experience adhering to **Supabase-style flat-but-layered structure**.

```
MENUIN BACKOFFICE
├── 📊 Dashboard (Executive Real-Time Overview)
│   ├── Outlet Switcher & Period Selector
│   ├── Core KPI Cards (Net Sales, Orders, AOV, Estimated Gross Margin)
│   ├── Hourly Sales Velocity Curve
│   ├── Category Revenue Share (Donut)
│   └── Top 5 Best-Selling Items
│
├── 📑 Reports (Laporan)
│   │
│   ├── 💵 Ringkasan Penjualan (Sales Summary)
│   │   ├── Penjualan Bruto vs Bersih (Gross vs Net)
│   │   ├── Rekap Pajak (PBJT) & Service Charge
│   │   └── Distribusi Saluran Penjualan (Dine-In, Takeaway, Delivery)
│   │
│   ├── 🍔 Analisis Menu & Produk (Menu Analytics)
│   │   ├── Performa Produk (Item Sales, Volume, Share)
│   │   ├── Analisis Kategori (Category Breakdown)
│   │   ├── Analisis Tambahan / Modifier (Add-on Attachments)
│   │   └── Estimasi Laba Kotor Menu (Theoretical Margin per Item)
│   │
│   ├── 💳 Pembayaran & Kas (Payments & Cash)
│   │   ├── Rekapitulasi Metode Pembayaran (Cash, QRIS, EDC, Transfer)
│   │   ├── Laporan Shift Kasir & Rekap Kas (Z-Report Close History)
│   │   └── Log Arus Kas Laci (Cash In / Out / Petty Cash)
│   │
│   ├── 🛡️ Audit & Keamanan (Loss Prevention & Audit)
│   │   ├── Log Pembatalan & Void (Void & Refund Log with Reasons)
│   │   └── Laporan Efektivitas Promosi & Diskon (Discount ROI)
│   │
│   └── 🏢 Multi-Outlet / Cabang (Multi-Location HQ — Pro Plan)
│       ├── Perbandingan Antar Cabang (Outlet Leaderboard)
│       └── Ringkasan Konsolidasi Perusahaan (Consolidated Corporate Sales)
│
└── ⚙️ Pengaturan Pembukuan & Ekspor (Accounting Export & Integration)
    ├── Ekspor Data Jurnal Harian (CSV / Excel format Jurnal & Accurate)
    └── Pemetaan Akun Dasar (Account Code Mapping for POS Clearing)
```

---

## 17. MVP Scope Recommendation (MoSCoW Prioritization)

To deliver an exceptional, robust product without over-engineering, features are classified strictly by business value and operational necessity.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 MVP PRIORITIZATION MATRIX                                   │
├────────────────────┬────────────────────────────────────────────────────────────────────────┤
│ Classification     │ Capabilities Included in Scope                                         │
├────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **MUST HAVE**      │ 1. Executive Dashboard (Net Sales, Order Count, AOV, Period Delta).    │
│ *(Launch Blocker)* │ 2. Standard Sales Summary (Gross Sales, Discounts, Refunds, Net Sales).│
│                    │ 3. Strict Shift Closing (Rekap Kas Z-Report with Blind Cash Count).    │
│                    │ 4. Cash Drawer Movement Logging (Cash In, Cash Out / Petty Cash).      │
│                    │ 5. Product & Category Sales Performance (Qty, Revenue, Share %).       │
│                    │ 6. Payment Tender Split (Cash vs. QRIS vs. EDC vs. Online).            │
│                    │ 7. Tax (PBJT) & Service Charge Collection Summary.                     │
│                    │ 8. Immutable Void & Refund Audit Log with Required Reason Codes.       │
│                    │ 9. Basic Multi-Outlet Switcher (Filter reports by active outlet).      │
│                    │ 10. Clean CSV / Excel Export for all sales and shift tables.           │
├────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **SHOULD HAVE**    │ 1. Theoretical Gross Margin based on Catalog Product `cost_price`.     │
│ *(Next Fast-Follow)│ 2. Hourly Sales & Rush Curve (Peak hour heatmap & pacing).             │
│                    │ 3. Modifier Attachment Analytics (Frequency and extra revenue).        │
│                    │ 4. Dining Option Segmentation (Dine-In vs. Takeaway vs. Delivery).     │
│                    │ 5. Promotional Code & Voucher Performance Tracking.                    │
│                    │ 6. Consolidated Multi-Outlet Summary Table (Side-by-side branch sales).│
│                    │ 7. Automated Daily Sales Journal CSV formatted for Mekari Jurnal.      │
├────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **COULD HAVE**     │ 1. Menu Engineering Matrix (BCG Star/Dog/Plowhorse/Puzzle Quadrant).   │
│ *(Post-Launch Q2)* │ 2. Cashier Performance Scorecard (Speed of service, average basket).   │
│                    │ 3. Table Occupancy & Seating Turn Time Analytics.                      │
│                    │ 4. Automated Daily Shift Summary Email/WhatsApp to Owner.              │
│                    │ 5. Direct Webhook Integration to Accurate Online / Mekari Jurnal.      │
├────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **FUTURE**         │ 1. Raw Ingredient Recipe Costing (Bill of Materials with sub-recipes). │
│ *(Advanced H2)*    │ 2. Inventory Stock Opname & Food Cost Variance (Actual COGS).          │
│                    │ 3. Purchase Order (PO) & Receiving Cost Reconciliation.                │
│                    │ 4. Labor Scheduling vs. Sales Pacing (Labor Cost %).                   │
├────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **OUT OF SCOPE**   │ 1. General Ledger & Double-Entry Journal Creation within MENUIN.       │
│ *(Never in Core)*  │ 2. Formal Balance Sheet & Asset Depreciation Schedules.                │
│                    │ 3. Bank Account Reconciliation (Direct Bank Feed Matching).            │
│                    │ 4. Corporate Income Tax Filing (SPT Tahunan PPh Badan).                │
│                    │ 5. Full Payroll Processing (BPJS, PPh 21 employee tax calculation).    │
└────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 18. Future Recommendations (Roadmap Phase 2 & 3)

### Phase 2: Advanced Menu Intelligence & Semi-Automated Bookkeeping
1. **Menu Engineering Matrix (BCG Quadrant):**
   * Automatically classify menu items into Stars (high popularity, high margin), Plowhorses (high popularity, low margin), Puzzles (low popularity, high margin), and Dogs (low popularity, low margin) to drive seasonal menu pruning.
2. **Direct Accounting API Connector:**
   * One-click OAuth synchronization to Mekari Jurnal and Accurate Online, posting daily consolidated journal entries automatically at 23:59:59.

### Phase 3: True Inventory COGS & Recipe Precision
1. **Ingredient-Level Recipe Engine:**
   * Support sub-recipes (e.g., Simple Syrup, Marinated Chicken batch prep) and portion deductions.
2. **Variance & Stock Opname Module:**
   * Enable periodic physical inventory counts to automatically compute **Actual COGS** and highlight kitchen waste/theft leakage percentages.

---

## 19. Out of Scope: The POS-Accounting Boundary

Attempting to build full accounting capabilities inside a POS system is a catastrophic engineering trap. The table below delineates the strict functional boundaries of MENUIN.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                          SYSTEM OF RECORD BOUNDARY DEFINITION                               │
├───────────────────────────────────┬─────────────────────────────────────────────────────────┤
│ Handled Authoritatively by MENUIN │ Delegated to Dedicated Accounting (Jurnal/Accurate/Xero)│
├───────────────────────────────────┼─────────────────────────────────────────────────────────┤
│ • Transaction timestamps & orders │ • Double-entry General Ledger (GL) posting              │
│ • Itemized catalog pricing & promos│ • Balance Sheet (Aset, Liabilitas, Ekuitas)            │
│ • Cash drawer till shifts (Rekap) │ • Bank Feed Reconciliation (Rekonsiliasi Bank)          │
│ • Sales Tax (PBJT) collection log │ • Corporate Income Tax Filing (SPT Masa / Tahunan)      │
│ • Theoretical recipe cost modeling│ • Fixed Asset Depreciation (Penyusutan Mesin Kopi, dsb) │
│ • Table turns and speed of service│ • Employee Payroll, BPJS Ketenagakerjaan & PPh 21       │
│ • Modifier attachment frequencies │ • Vendor Accounts Payable (Hutang Usaha Supplier)       │
└───────────────────────────────────┴─────────────────────────────────────────────────────────┘
```

---

## 20. Financial Metric Glossary

* **Gross Sales (Penjualan Bruto):** The total nominal value of all products and services billed to customers at standard catalog menu prices before any deductions.
* **Discounts / Comps (Potongan Penjualan):** Price reductions granted via promotions, vouchers, loyalty rewards, or manager courtesy concessions.
* **Refunds / Voids (Pembatalan & Retur):** Settled or in-progress transactions reversed due to order error, product defect, or customer cancellation.
* **Net Sales (Penjualan Bersih):** Gross Sales minus Discounts minus Refunds. Represents the actual operating revenue earned by the establishment.
* **PBJT Makanan dan Minuman (Pajak Restoran / PB1):** A regional consumption tax (max 10% under UU No. 1/2022 HKPD) collected from customers as a pass-through liability owed to local government.
* **Service Charge:** A mandatory customer charge pooled to fund employee service welfare or operational service upkeep.
* **Total Collected (Total Penerimaan):** Net Sales + PBJT Tax + Service Charge. Represents total liquidity collected across all payment tenders.
* **Theoretical COGS (HPP Teoretis):** Direct ingredient costs calculated by multiplying units sold by standard recipe/catalog unit costs.
* **Actual COGS (HPP Aktual):** Realized direct ingredient expenditure derived from physical inventory formula: Beginning Inventory + Purchases - Ending Inventory.
* **Food Cost Variance:** The mathematical gap between Actual COGS and Theoretical COGS, representing waste, spoilage, over-portioning, or shrinkage.
* **Gross Profit (Laba Kotor):** Net Sales minus COGS. Represents available funds to cover labor, occupancy, and operating overhead.
* **Prime Cost:** The sum of COGS and Total Labor Expenses relative to Net Sales; benchmark of operational health (target 55% – 62%).
* **AOV (Average Order Value):** Net Sales divided by Total Completed Transactions.
* **RevPASH (Revenue Per Available Seat Hour):** Net sales divided by the product of available seats and operational hours; measures restaurant space utilization efficiency.
* **Z-Report (Rekap Kas Akhir Shift/Hari):** The final, immutable shift close summary reconciling expected drawer cash against actual counted cash.

---

## 21. Risks, Limitations & Anti-Patterns

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                                 CRITICAL RISK REGISTER                                      │
├─────────────────────┬───────────────────────────────┬───────────────────────────────────────┤
│ Risk / Anti-Pattern │ Root Mechanism                │ Mitigation Architecture in MENUIN     │
├─────────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ **The "Phantom**    │ POS displays (Sales - Cost)   │ Label metric strictly as "Estimasi    │
│ **Profit" Trap**    │ as "Laba Bersih". Owner       │ Margin Kotor Teoretis" with clear UI  │
│                     │ assumes rent and labor are    │ tooltips: "Belum memperhitungkan biaya│
│                     │ covered, spending capital.    │ sewa, gaji, limbah, dan operasional." │
├─────────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ **Tax Revenue**     │ Netting PBJT tax into sales   │ Isolate tax in a dedicated section;   │
│ **Commingling**     │ revenue, causing business to  │ explicitly subtract tax before running│
│                     │ spend tax funds needed for    │ store margin calculations.            │
│                     │ municipal Bapenda remittance. │                                       │
├─────────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ **Cashier Count**   │ Showing expected cash on the  │ Enforce **Blind Shift Close**. Cashier│
│ **Peeking**         │ till before cashier counts    │ enters physical cash count first;     │
│                     │ money, enabling silent theft. │ variance is revealed only to manager. │
├─────────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ **Aggregator Payout│ Booking gross Grab/GoFood cart│ Track platform commission rate (20%); │
│ **Shortfall**       │ value as expected bank cash,  │ display "Estimasi Penerimaan Bersih   │
│                     │ ignoring 20% platform fee.    │ Merchant" alongside gross platform val│
├─────────────────────┼───────────────────────────────┼───────────────────────────────────────┤
│ **Zero-Cost Margin**│ When product catalog has      │ Automatically flag missing cost items │
│ **Distortion**      │ `cost_price = 0`, dashboard   │ with warning icon: "3 produk belum    │
│                     │ computes 100% margin.         │ memiliki data HPP dasar."             │
└─────────────────────┴───────────────────────────────┴───────────────────────────────────────┘
```

---

## 22. Open Business & Technical Questions

1. **Midtrans Online Settlement Latency:**
   * *Question:* When customers pay via Storefront QRIS (Midtrans), settlement to the merchant bank account takes $T+1$ or $T+2$ business days. Should MENUIN's Daily Financial Summary reflect *Gross Authorized Sales* or *Settled Bank Deposits*?
   * *Recommendation:* Display Gross Authorized as **Earned Revenue (Net Sales)**, but track clearing status in a dedicated **Digital Receivable Pipeline** tab.
2. **Aggregator Commission Calculation Scope:**
   * *Question:* Should MENUIN allow custom commission rates per online platform (e.g., GrabFood 20%, ShopeeFood 15%, Direct Storefront 0%)?
   * *Recommendation:* Yes. MENUIN's `tenants` table already contains `grab_food_fee_rate`, `shopee_food_fee_rate`, and `go_food_fee_rate`. The reporting engine should use these to calculate estimated net merchant payouts.
3. **Multi-Unit Inventory Transfer Pricing:**
   * *Question:* When central kitchen ships syrup to Branch B, how is transfer cost recorded?
   * *Recommendation:* Defer internal transfer pricing to Phase 3; record only physical quantity transfers in MVP inventory movement logs.

---

## 23. Final Strategic Recommendation & Synthesis

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│                            THE MENUIN REPORTING ECOSYSTEM                                   │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  CORE ESSENCE: "Clarity over Clutter — Transaction Integrity over Pseudo-Accounting"        │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  1. EXECUTIVE DASHBOARD                                                                     │
│     • High-impact summary cards: Net Sales, Completed Orders, AOV, Estimated Gross Margin.  │
│     • Visual comparison vs. previous period (day-on-day, week-on-week).                     │
│     • Real-time shift cash safety status badge.                                             │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  2. MANAGEMENT & OPERATIONAL REPORTS                                                        │
│     • Strict sales breakdown: Gross Sales ──▶ Discounts ──▶ Refunds ──▶ Net Sales.          │
│     • Isolated Pass-Through Ledger: PBJT Tax (10%) and Service Charge liabilities.          │
│     • Shift End Z-Report with mandatory Blind Cash Counting.                                │
│     • Item, Category, and Modifier Sales Mix analysis.                                      │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  3. ENTERPRISE MULTI-OUTLET AGGREGATION                                                     │
│     • Top-level consolidated revenue rollups for brand owners.                              │
│     • Branch-by-branch comparative leaderboard with leakage/variance auditing.              │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│  4. CLEAN ACCOUNTING HANDOFF                                                                │
│     • Standardized CSV/Excel exports pre-formatted for Mekari Jurnal and Accurate Online.   │
│     • Standard Chart of Accounts (CoA) journal mappings built directly into sales recaps.   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 24. Sources & Industry References

1. **Toast POS Official Knowledge Base & Documentation**
   * *URL:* `https://central.toasttab.com/s/article/Sales-Summary-Report` & `https://pos.toasttab.com/blog/on-the-line/restaurant-metrics`
   * *Type:* Official Product & Educational Documentation
   * *Relevant Information:* Standards for Gross Sales vs. Net Sales, revenue center segmentation, and shift close reconciliation.
   * *Access Date:* September 2026

2. **Square for Restaurants Reporting Documentation**
   * *URL:* `https://squareup.com/help/us/en/article/5416-sales-reports-with-square-for-restaurants`
   * *Type:* Official Product Documentation
   * *Relevant Information:* Balance-sheet style sales summary structure; distinction between Net Sales and Total Collected.
   * *Access Date:* September 2026

3. **Lightspeed Restaurant (K-Series) Back Office Documentation**
   * *URL:* `https://restaurant-support.lightspeedhq.com/hc/en-us/articles/360012521194-About-Advanced-Insights`
   * *Type:* Official Product Documentation
   * *Relevant Information:* Magic Menu Quadrant (Menu Engineering BCG Matrix), server performance metrics, and shift reporting.
   * *Access Date:* September 2026

4. **Clover Help Center & Till Management Guide**
   * *URL:* `https://www.clover.com/help/reporting-app`
   * *Type:* Official Product Documentation
   * *Relevant Information:* Till closeout workflows, cash log audit trails, and employee sales accountability.
   * *Access Date:* September 2026

5. **Moka POS Backoffice Documentation**
   * *URL:* `https://support.mokapos.com/hc/id/articles/360016480031-Laporan-Shift`
   * *Type:* Domestic Market Product Documentation
   * *Relevant Information:* Indonesian POS shift reporting structure, expected cash calculation, and sales summary layout.
   * *Access Date:* September 2026

6. **Majoo Backoffice & Inventori Guide**
   * *URL:* `https://majoo.id/solusi/fitur/laporan`
   * *Type:* Domestic Market Product Documentation
   * *Relevant Information:* Automated recipe-driven HPP calculation, role-based cost masking, and mobile owner dashboard.
   * *Access Date:* September 2026

7. **Pawoon Help Center**
   * *URL:* `https://help.pawoon.com/`
   * *Type:* Domestic Market Product Documentation
   * *Relevant Information:* Rekap kas workflow, product sales reporting, and direct integration with Mekari Jurnal.
   * *Access Date:* September 2026

8. **Olsera Backoffice & Pembukuan Documentation**
   * *URL:* `https://www.olsera.com/id/fitur/laporan`
   * *Type:* Domestic Market Product Documentation
   * *Relevant Information:* Petty cash logging, waiter commission reporting, and cloud stock movement audit logs.
   * *Access Date:* September 2026

9. **Mekari Jurnal POS Integration Standards**
   * *URL:* `https://jurnal.id/id/fitur/integrasi-pos/`
   * *Type:* Financial Accounting System Documentation
   * *Relevant Information:* Chart of Accounts (CoA) mapping for POS daily consolidated sales journals, FIFO/Average inventory sync, and PBJT tax tracking.
   * *Access Date:* September 2026

10. **Accurate Online (AOL) Restoran & F&B Guide**
    * *URL:* `https://accurate.id/solusi/fnb/`
    * *Type:* Financial Accounting System Documentation
    * *Relevant Information:* Multi-satuan recipe bills of material, stock opname reconciliation, and multi-outlet consolidation.
    * *Access Date:* September 2026

11. **Undang-Undang Republik Indonesia Nomor 1 Tahun 2022 (UU HKPD)**
    * *Document:* UU Hubungan Keuangan antara Pemerintah Pusat dan Pemerintahan Daerah
    * *Type:* Statutory Law / Tax Legislation
    * *Relevant Information:* Formal codification of Pajak Barang dan Jasa Tertentu (PBJT) atas Makanan dan/atau Minuman (formerly PB1); maximum 10% rate ceiling; definition of Dasar Pengenaan Pajak (DPP) inclusive of Service Charge.
    * *Access Date:* September 2026

12. **Uniform System of Accounts for Restaurants (USAR)**
    * *Publisher:* National Restaurant Association (NRA)
    * *Type:* Global F&B Financial Accounting Standard
    * *Relevant Information:* Prime Cost benchmarks (55% – 62%), standard classification of food and beverage revenues, operating expense taxonomy, and restaurant income statement structure.
    * *Access Date:* September 2026
