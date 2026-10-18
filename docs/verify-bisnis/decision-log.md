# Architectural Decision Log: MENUIN Business Verification & Admin Verification

**Feature:** MENUIN Business Verification, Admin Verification & DOKU Payment Onboarding  
**Status:** PROPOSED — AWAITING USER APPROVAL  
**Last Updated:** 2026-10-15  
**Author:** Technical Lead & Architecture Analyst  

---

## Decision 1: Entity Attachment — Business Profiles vs. Tenants (Outlets) vs. Accounts

### Context
In MENUIN:
- `accounts` represents global human user identities (`authUserId`, `email`, `name`).
- `tenants` represents outlets (`outletKey`, `name`, `address`, `city`, `dokuClientId`, `dokuSubAccountId`, `onlinePaymentEnabled`).
- `memberships` joins `accounts` and `tenants` with roles (`OWNER`, `MANAGER`, `CASHIER`, `STAFF`).
An F&B business owner often operates multiple outlets (e.g., branches or food trucks) under a single legal business entity (e.g., PT, CV, or Perorangan).

### Options Considered
1. **Option A: Attach Verification directly to `tenants` (Outlet-level).**
   - *Pros:* Requires no new parent entity; every outlet is verified independently.
   - *Cons:* Multi-outlet owners must re-upload KTP, NPWP, and NIB for every single outlet. Severe merchant friction, duplicate document storage, inconsistent verification states across branches of the same brand.
2. **Option B: Attach Verification directly to `accounts` (Account-level).**
   - *Pros:* Simple one-to-one mapping with the user.
   - *Cons:* Accounts represent people, not companies. An individual could own two entirely different businesses (e.g., a coffee shop and a boutique bakery) with different legal registrations and bank accounts.
3. **Option C: Introduce a dedicated `business_profiles` entity linked to `accounts.id` (Owner) and referenced by `tenants` (Recommended).**
   - *Pros:* Solves both single-outlet and multi-outlet scenarios cleanly. The legal entity and compliance documentation (KTP, NPWP, NIB, Bank statement) are verified once at the `business_profiles` level. Multiple `tenants` (outlets) owned by the merchant reference `business_profile_id`. Per-outlet sub-accounts can still be mapped. Zero duplicate document uploads.
   - *Cons:* Requires one new table and a foreign key column on `tenants`.

### Recommendation
**Adopt Option C (`business_profiles`).**
- `business_profiles` stores the verified legal business identity.
- `tenants.business_profile_id` references `business_profiles.id` (nullable for backwards compatibility).
- Outlets belonging to the verified business profile inherit payment readiness eligibility once their outlet settings (e.g. sub-account) are active.

---

## Decision 2: Multi-Outlet Representation & Verification Inheritance

### Context
When a merchant owner adds a second or third outlet, how does verification propagate?

### Options Considered
1. **Automatic Full Inheritance:** Any new outlet created under the account automatically inherits payment readiness without checks.
   - *Risk:* DOKU requires distinct sub-account registration or branch address confirmation for separate POS locations.
2. **Business Verification Inherited + Outlet Payment Onboarding Guarded (Recommended):**
   - Business verification (KTP, NPWP, legal entity) is inherited from `business_profiles`.
   - Payment activation on the new outlet still requires registering or linking the outlet's DOKU Sub-Account (`dokuSubAccountId`).
   - The merchant does NOT need to re-upload company legal docs, but simply binds the outlet to the verified business profile.

### Recommendation
**Adopt Option 2.** Business legal compliance is done once. Outlet payment activation requires only sub-account linkage and verified status inheritance.

---

## Decision 3: Submission Versioning & History Preservation (Snapshot Pattern)

### Context
Merchants may submit an initial application, receive an `action_required` review asking for a clearer KTP photo, and resubmit. Internal auditors and compliance require viewing the exact snapshot of data and documents submitted at each point in time.

### Options Considered
1. **Mutable In-Place Updates:** Overwrite columns on `business_profiles` and document rows.
   - *Cons:* Destroys audit trail. Reviewers cannot verify what changed between revision 1 and revision 2.
2. **Immutable Submission Attempts with JSONB Snapshot (Recommended):**
   - Master entity: `business_profiles` (holds current approved/draft profile).
   - Versioned entity: `verification_submissions` (tracks each attempt: `attempt_number`, `status`, `submission_snapshot` JSONB, `submitted_at`, `reviewed_at`, `reviewed_by`, `decision_reason`, `internal_notes`).
   - `verification_documents`: Linked to `submission_id`. Each attempt has its own document records. If a document is re-used from attempt 1 (e.g. NPWP was accepted, only KTP needed re-upload), the reference is copied with status `ACCEPTED`.

### Recommendation
**Adopt Option 2.** Provides 100% auditable history, prevents overwriting historical compliance records, and supports seamless resubmission.

---

## Decision 4: Separation of Verification Statuses vs. DOKU Status vs. Payment Readiness

### Context
A merchant may be verified internally by MENUIN compliance, but DOKU sub-account onboarding may still be processing, or conversely, DOKU sub-account is generated in sandbox while internal verification is not yet completed. Conflating these leads to unauthorized payments or broken checkouts.

### Options Considered
1. **Single Combined Status Column:** `status: DRAFT | SUBMITTED | DOKU_PENDING | VERIFIED | ACTIVE`.
   - *Cons:* Fragile, causes race conditions when internal review finishes before or after DOKU webhook/sync.
2. **Strictly Decoupled Status Models (Recommended):**
   - `menuin_verification_status`: `not_started`, `draft`, `submitted`, `under_review`, `action_required`, `verified`, `rejected`, `suspended`.
   - `doku_onboarding_status`: `not_submitted`, `pending_review`, `needs_revision`, `active`, `rejected`, `suspended`.
   - `is_payment_ready` (Derived Server Gate): True ONLY when `internal_status === 'verified'` AND `doku_status === 'active'` AND required credentials exist.

### Recommendation
**Adopt Option 2.** Explicit separation prevents internal approval from prematurely enabling live payments without verified provider backing.

---

## Decision 5: Authorization & RBAC for Admin Review vs. MENUIN Care

### Context
MENUIN Care is a customer support module. Customer service agents handle tickets, answer merchant questions, and communicate status. Verification decisions (approvals, rejections, escalations) involve legal liability, KYC compliance, and fraud risk.

### Options Considered
1. **Allow any staff/support user with admin access to review verification.**
   - *Cons:* Violates principle of least privilege. Care agents could accidentally or maliciously approve unverified merchants.
2. **Strict Permission Separation (Recommended):**
   - Only users with role `SYSTEM_ADMIN` or permission `verification.review` can execute review actions (`APPROVE_INTERNAL`, `REJECT`, `REQUEST_CHANGES`, `ESCALATE`).
   - Support / MENUIN Care agents have `verification.view_summary` permission only: they can see high-level status, submission ID, and merchant-visible notes to assist users in chat/tickets, but CANNOT see unmasked PII (full NIK, full bank account) or trigger status decisions.

### Recommendation
**Adopt Option 2.** Hard server-side enforcement on all review actions.

---

## Decision 6: Secure Document Storage — Private Bucket & Short-Lived Signed URLs

### Context
Current storage implementation (`apps/web/src/lib/actions/storage.ts`) uses public buckets (`public: true`) returning permanent public URLs. Verification documents (KTP, NPWP, Rekening Koran) are confidential PII protected by Indonesian PDP Law (UU Perlindungan Data Pribadi No. 27/2022).

### Options Considered
1. **Store in existing public bucket with random filenames.**
   - *Cons:* SEVERE SECURITY VULNERABILITY. Anyone guessing or intercepting the URL can access merchant identity documents.
2. **Dedicated Private Bucket with Short-Lived Signed URLs (Recommended):**
   - Create private Supabase Storage bucket `verification-documents` (`public: false`).
   - Storage path: `business_${businessProfileId}/sub_${submissionId}/${docType}_${uuid}.${ext}`.
   - Access restricted: Files can only be downloaded/viewed via signed URLs with a 60-second TTL (`createSignedUrl(path, 60)`).
   - Only authorized reviewers and the owning merchant can request a signed URL.

### Recommendation
**Adopt Option 2.** Non-negotiable security requirement.

---

## Decision 7: Concurrency Control & Duplicate Submission Prevention

### Context
A merchant could click "Submit" multiple times rapidly, or an admin and merchant could perform concurrent actions (e.g., admin marks `action_required` while merchant submits draft).

### Options Considered
1. **Client-side button disabling only.**
   - *Cons:* Bypassed by network retries or direct API calls.
2. **Database Transactions with State Validation & Idempotency Key (Recommended):**
   - State transition validation on the server: `submitVerification` only transitions from `draft` or `action_required` to `submitted`.
   - Wrap submission updates in database transactions.
   - Use idempotency keys on sensitive submission endpoints.

### Recommendation
**Adopt Option 2.** Robust server-side protection.

---

## Decision 8: Server-Side Payment-Readiness Enforcement (Double Gating)

### Context
Currently, `tenants.onlinePaymentEnabled` can be set in settings. If a merchant manipulates this field or bypasses the UI, can payments be processed?

### Options Considered
1. **Hide "Enable Payment" toggle in frontend until verified.**
   - *Cons:* Insufficient. A malicious actor can call the server action or POST request directly.
2. **Double Gating (Frontend UI + Server Action Guard + Runtime Checkout Assertion) (Recommended):**
   - *Layer 1 (UI):* Toggle disabled with clear status badge explaining requirement.
   - *Layer 2 (Settings Action):* `updatePaymentIntegration` rejects setting `onlinePaymentEnabled = true` unless `assertPaymentReady(tenantId)` passes.
   - *Layer 3 (Runtime Checkout):* Before generating a QRIS or payment charge (`/api/checkout`, `/api/pos`), backend verifies `assertPaymentReady(tenantId)`. If not ready, throws `PaymentNotVerifiedError`.

### Recommendation
**Adopt Option 2.** Defense in depth.

---

## Decision 9: Admin Panel Architecture & Route Consolidation

### Context
In earlier commits (`563dc62`), a `/system-admin` dashboard existed with routes `/system-admin/tenants` and `/system-admin/users`. When `apps/web` was restructured, `system-admin.ts` actions and middleware protection remained, but page components were not migrated.

### Options Considered
1. **Create a completely new route tree `/admin/verification` separated from existing system admin.**
   - *Cons:* Splits admin interfaces, causes duplicate sidebars and layouts.
2. **Restore and consolidate into the existing protected `/system-admin` route tree (Recommended):**
   - Layout: `apps/web/src/app/system-admin/layout.tsx` with sidebar matching MENUIN design guidelines (Menuin Royal Blue, Poppins/Inter, borderless badges).
   - Routes:
     - `/system-admin` (Overview metrics)
     - `/system-admin/merchants` (Tenants & Business profiles)
     - `/system-admin/verification` (Review Queue & Overview)
     - `/system-admin/verification/[id]` (Verification Detail & Decision Console)
     - `/system-admin/payments` (DOKU Sub-Account Onboarding & Gateway status)
     - `/system-admin/audit` (Compliance & Review Audit Trail)

### Recommendation
**Adopt Option 2.** Leverages existing `middleware.ts` (`pathname.startsWith('/system-admin')`) and `system-admin.ts` server actions.

---

## Decision 10: Humanized Status Communication & Copy Standards

### Context
Compliance and verification workflows often suffer from confusing, overly technical, or robotic status messages that frustrate merchants.

### Options Considered
1. **Generic technical status codes (e.g. `STATUS_ERROR_502`, `DOC_REJECTED`).**
   - *Cons:* Causes support ticket spikes and merchant anxiety.
2. **Humanized, Action-Oriented Indonesian Copy (Recommended per `humanizer` & `impeccable`):**
   - Merchant-facing copy specifies *what is happening*, *why*, and *what the merchant should do next* in clear, conversational Indonesian.
   - Status labels:
     - `not_started`: "Belum Diverifikasi" — *Mulai verifikasi bisnis untuk mengaktifkan pembayaran QRIS.*
     - `draft`: "Draf Disimpan" — *Lanjutkan pengisian data bisnis Anda.*
     - `submitted`: "Menunggu Pemeriksaan" — *Data Anda telah diterima dan sedang masuk antrean tim kepatuhan MENUIN.*
     - `under_review`: "Sedang Ditinjau" — *Tim verifikasi sedang memeriksa kelengkapan dokumen bisnis Anda.*
     - `action_required`: "Perlu Perbaikan" — *Ada data atau dokumen yang perlu diperbaiki sebelum dapat disetujui. Lihat catatan di bawah.*
     - `verified`: "Terverifikasi" — *Verifikasi bisnis MENUIN disetujui. Sistem sedang menyiapkan aktivasi pembayaran DOKU.*
     - `rejected`: "Pengajuan Ditolak" — *Pengajuan belum memenuhi syarat kepatuhan. Alasan terlampir.*
     - `suspended`: "Akses Ditangguhkan" — *Aktivitas verifikasi atau pembayaran ditangguhkan sementara.*

### Recommendation
**Adopt Option 2.** Clear, empathetic, and unambiguous copy.

---

## Decision 11: Integration with Team's DOKU Sub Account V2 Implementation

### Context
The team has introduced a native DOKU integration in `apps/web/src/lib/payments/doku/`:
- `sub-account.ts`: uses SNAP B2B token + symmetric signature to call `POST /sub-account/v2.0/register` with `parentProfileId = config.clientId`.
- `settings.ts` (`activateDokuSubAccount`): provisions sub-accounts with a database-level concurrency lock (`SUB_ACCOUNT_PROVISIONING`) and writes `doku_sub_account_id` and `doku_sub_account_status` to `tenants`.
- `checkout.ts`: attaches `additional_info.account.id = subAccountId` to direct funds to the outlet's sub-account.

### Options Considered
1. **Option A: Replace the team's code with a different sub-account approach.**
   - *Cons:* Wasteful, contradicts tested code that already follows Bank Indonesia SNAP standards and DOKU Jokul v2.
2. **Option B: Adopt and build directly upon the team's DOKU implementation, adding missing compliance gates (Recommended):**
   - Retain `createSubAccount`, `snapPost`, and the concurrency locking mechanism in `activateDokuSubAccount`.
   - Add a strict prerequisite gate: `activateDokuSubAccount` can only execute if the merchant's `business_profiles` verification status is `verified`.
   - Prevent any unverified merchant from making calls to DOKU's production sub-account registration endpoint.

### Recommendation
**Adopt Option B.** Retain and enhance the team's existing DOKU code by placing the Business Verification compliance gate directly in front of sub-account provisioning.

---

## Decision 12: Unified Payment Readiness Engine & Catalog Ordering Gate

### Context
Currently, `apps/web/src/lib/actions/catalog.ts` (`updateOrderingSettings`) allows toggling `onlinePaymentEnabled = true` on `tenants` without checking if business verification is completed or if a DOKU sub-account is active. In `apps/web/src/lib/payments/availability.ts`, `isOnlinePaymentAvailable` only checks `tenant.onlinePaymentEnabled` and whether `dokuSubAccountId` is present.

### Options Considered
1. **Option A: Keep checks separate in each controller.**
   - *Risk:* Inconsistent enforcement. An engineer might add a new checkout channel that forgets to check verification status.
2. **Option B: Centralized pure evaluation function `evaluatePaymentReadiness(tenantId)` (Recommended):**
   - Checks:
     1. Platform configured (`isDokuConfigured()`).
     2. Business profile verified (`business_profile.verification_status === 'verified'`).
     3. Outlet sub-account active (`tenant.doku_sub_account_status === 'ACTIVE'` and `tenant.doku_sub_account_id != null`).
     4. Merchant toggle enabled (`tenant.online_payment_enabled === true`).
   - Reused across:
     - `catalog.ts`: Blocks enabling the toggle in UI and returns an actionable error if not verified.
     - `settings-client.tsx`: Renders accurate status badge and hides/disables activation if unverified.
     - `payment.service.ts` (`startOrderPayment` & `startQrisPayment`): Runtime gate before creating `payment_attempts`.

### Recommendation
**Adopt Option B.** Unify all payment availability and readiness decisions into a single tested engine (`apps/web/src/lib/verification/payment-readiness.ts`).

---

## Decision 13: Sub-Account Provisioning Lifecycle & Multi-Outlet Inheritance

### Context
In MENUIN, one merchant owner may operate multiple outlets (`tenants`). The team's current `createSubAccount` registers a sub-account per tenant (`name: tenant.name`).

### Options Considered
1. **Option A: Single global sub-account for all outlets under one business.**
   - *Cons:* Eliminates per-outlet cashflow separation and conflicts with DOKU POS QRIS terminal assignment.
2. **Option B: Per-outlet sub-account provisioned upon verified business profile (Recommended):**
   - Business legal verification (KTP, NPWP, NIB, Bank Rekening) is submitted and verified **ONCE** at the `business_profiles` level.
   - Once verified, the merchant owner can provision a DOKU Sub Account for each outlet with a single click (or automatically on admin approval), inheriting the verified legal entity data without re-uploading documents.
   - Each outlet receives its own `doku_sub_account_id`, preserving granular settlement reports in DOKU and POS terminal mapping.

### Recommendation
**Adopt Option B.** One verification per business entity; separate sub-accounts per outlet with automatic inheritance of verified identity.

---

## Decision 14: Settlement Bank Account Capture & PII Security

### Context
DOKU Sub Account funds must settle to the merchant's commercial bank account. The team's `createSubAccount` currently collects only name and email.

### Options Considered
1. **Collect bank details outside MENUIN (manual DOKU dashboard setup).**
   - *Cons:* High merchant drop-off and lack of reconciliation in MENUIN reports.
2. **Capture and verify bank details in the Business Verification Wizard (Recommended):**
   - Collect Bank Name, Account Number, Account Holder Name, and Bank Statement/Passbook proof (`buku_tabungan`).
   - Store bank account numbers with AES-GCM encryption or strict service-role isolation, and mask in UI (`BCA ••••••1234`).
   - Store document images in private Supabase bucket `verification-documents` accessed via 60-second signed URLs.

### Recommendation
**Adopt Option 2.** Complete, compliant, and fraud-resistant verification lifecycle.

---

## Decision 15: Hierarchy & Relational Cardinality — 1 Account to N Business Profiles to M Outlets (1:N:M)

### Context
A business owner in MENUIN may operate multiple food brands or corporate entities under a single login. For example, Zidane owns "PT Berkah Kuliner" (operating 3 coffee shop outlets under the brand "Kopi Jotos") AND also owns "CV Selaras Boga" (operating 2 restaurant outlets under the brand "Bakmi Sedap"). Conflating all outlets into a single business profile forces unrelated businesses to share legal documents and bank accounts.

### Options Considered
1. **Option A: 1 Account = 1 Business Profile = N Outlets (Strict 1:1:N).**
   - *Cons:* Merchants with multiple legal entities (e.g. one PT and one CV, or separate franchise entities) cannot separate their legal identities, tax reporting, or bank settlement accounts.
2. **Option B: 1 Account to N Business Profiles to M Outlets (1:N:M) (Recommended):**
   - Cardinality:
     - `accounts` (1) ───< (N) `business_profiles` (Legal Entities / Tax Identities)
     - `business_profiles` (1) ───< (M) `tenants` (Physical Outlets / Locations)
   - An account can create and manage multiple business profiles.
   - Each business profile isolates its own legal name, business type (Perorangan vs. Badan Usaha), tax ID (NPWP), business license (NIB), corporate deed (Akta), and settlement bank account.
   - Each outlet (`tenant`) links to exactly one `business_profile_id` (or none if unlinked/unverified).
   - An owner can assign multiple outlets to the same business profile (e.g. Outlet Kemang, Outlet Senopati, and Outlet BSD all link to "PT Berkah Kuliner").

### Recommendation
**Adopt Option B (1:N:M).** Provides complete multi-entity flexibility for growing restaurant groups while keeping data models strictly normalized and avoiding document mixing across distinct corporate entities.

---

## Decision 16: Two-Tier Verification Separation (Business Identity Tier vs. Outlet Location Tier)

### Context
Compliance requirements demand both proof of legal entity validity (who owns the business and is legally responsible) and physical reality of the trading location (where food is prepared and served, to prevent fictitious merchant fraud).

### Options Considered
1. **Option A: Monolithic verification per outlet.**
   - *Cons:* Severe friction. Forces owners to upload KTP, NPWP, and NIB repeatedly for every branch location.
2. **Option B: Full automatic inheritance without outlet verification.**
   - *Risk:* Severe compliance vulnerability. An approved business profile could add 50 fictitious outlet locations without providing valid street addresses or storefront evidence, violating Bank Indonesia and DOKU compliance standards.
3. **Option C: Two-Tier Verification Separation (Recommended):**
   - **Tier 1: Business Identity & Legal Entity (`business_profiles`)**:
     - *Scope:* Owner/Director identity (KTP, NIK), corporate legal permits (NPWP, NIB, Akta Pendirian, SK Kemenkumham), and primary business settlement bank account.
     - *Reusability:* Verified **once** per business profile. Valid documents can be reused across all outlets linked to this business profile without repeated uploads.
   - **Tier 2: Outlet Location & Operational Evidence (`tenants`)**:
     - *Scope:* Specific street address, city, postal code, GPS coordinates, storefront photo with visible signage, cashier/operational area photo, and local branch permits (if mandated).
     - *Verification:* Evaluated **per outlet**. An outlet is NOT automatically compliant simply because its parent business profile is verified.

### Recommendation
**Adopt Option C.** Eliminates redundant document uploads for legal identities while guaranteeing that every physical outlet has verified address and storefront evidence.

---

## Decision 17: Decoupled 4-State Verification Architecture

### Context
Conflating internal compliance, outlet completeness, payment gateway onboarding, and checkout availability into a single flag causes fragile dependencies and invalid assumptions.

### Options Considered
1. **Single binary boolean (`is_verified`).**
   - *Cons:* Impossible to represent granular states (e.g., business verified internally but DOKU sub-account still provisioning or suspended).
2. **Decoupled 4-State Engine (Recommended):**
   - **State 1: Internal Business Verification Status** (`business_profiles.verification_status`):
     `not_started` | `draft` | `submitted` | `under_review` | `action_required` | `verified` | `rejected` | `suspended`
   - **State 2: Outlet Compliance Status** (`tenants.outlet_compliance_status`):
     `incomplete` | `ready_for_review` | `verified` | `action_required`
   - **State 3: DOKU Sub-Account Onboarding Status** (`tenants.doku_sub_account_status`):
     `NOT_PROVISIONED` | `PROVISIONING` | `ACTIVE` | `PENDING_REVIEW` | `SUSPENDED` | `FAILED`
   - **State 4: Payment Readiness (Pure Evaluated State)** (`isPaymentReady(tenantId)`):
     Evaluates to `READY` if and only if:
     1. Business Profile Status == `verified`
     2. Outlet Compliance Status == `verified`
     3. DOKU Sub-Account Status == `ACTIVE` (with valid `dokuSubAccountId`)
     4. Merchant Toggle `online_payment_enabled` == `true`
     5. Platform DOKU credentials are valid and configured.

### Recommendation
**Adopt Option 2.** Complete state decoupling prevents cascading state corruption and enables independent auditing of each compliance layer.

---

## Decision 18: Architectural Impact Analysis on Registration & Existing Business Operations

### Context
A primary design requirement is that adding business verification and multi-profile logic must not break or disrupt existing merchant signup, daily POS operations, or restaurant workflows.

### Detailed Impact Assessment
1. **Account Registration Flow (`/auth/register`, `signupAction` in `auth.ts`)**:
   - **Impact: ZERO BREAKING CHANGES.**
   - The user signup flow (`accounts` -> `tenants` -> `memberships`) remains 100% unchanged.
   - `tenants.business_profile_id` is created as **NULLABLE**.
   - New merchants can sign up, access their dashboard, setup menus, and start taking cash orders in under 2 minutes without facing compliance friction during signup.
   - Business verification is introduced via **progressive disclosure**: merchants only complete verification when they decide to activate online payments (DOKU Checkout & Dynamic QRIS).
2. **Daily POS Kasir Operations & Offline Payments**:
   - **Impact: ZERO REGRESSION.**
   - Cash checkout, manual QRIS/transfer, split bills, kitchen slips, kitchen printer auto-cut, and cash drawer management do NOT depend on `business_profiles` or DOKU sub-accounts.
   - Existing outlets without verification continue operating normally.
3. **Multi-Outlet Switcher & Navigation**:
   - **Impact: ZERO REGRESSION.**
   - The existing outlet switcher reads memberships (`memberships.accountId == user.id`), which remains untouched.
   - Outlets can be linked to existing verified business profiles at any time from Settings without affecting store routing or slugs.

### Recommendation
Proceed with the non-intrusive additive model. All verification columns and relations are strictly non-blocking for core POS and catalog operations.

---

## Decision 19: DOKU Confirmation Dependencies & Assumptions Classification

### Context
Per compliance and architectural guidelines, MENUIN must never hardcode assumptions about external payment gateway capabilities that have not been formally confirmed.

### Classification Matrix
1. **Confirmed Capabilities (Backed by Active Code, Tests, and Jokul/SNAP Docs)**:
   - DOKU SNAP V2 Sub-Account registration endpoint: `POST /sub-account/v2.0/register` with `{ partnerReferenceNo, type, email, name, parentProfileId }`.
   - Asymmetric RSA-SHA256 signature for SNAP B2B token retrieval.
   - Symmetric HMAC-SHA512 signature for SNAP QRIS generation (`/qr/qr-mpm-generate`).
   - Non-SNAP HMAC-SHA256 signature and constant-time equality check for Checkout and notifications.
   - Sub-account split settlement routing via `additional_info.account.id = subAccountId` in Checkout.
2. **Unconfirmed Items Requiring Formal Provider Clarification (External Dependencies)**:
   - **Dependency 1 (Outlet Physical Address Payload)**: Does DOKU's Sub-Account V2 registration API support or require physical outlet address fields (street, city, postal code), or is address validation managed entirely by MENUIN for compliance audit?
   - **Dependency 2 (Sub-Account Production Approval Lifecycle)**: In DOKU's production aggregator environment, are sub-accounts instantly active upon successful registration (`200 OK`), or does DOKU trigger an asynchronous internal KYC review before enabling settlement?
   - **Dependency 3 (Document Reuse Policy across Sub-Accounts)**: Does DOKU allow multiple sub-accounts to share the same parent tax ID (NPWP) and legal representative under a single platform aggregator contract?
   - **Dependency 4 (Risk/Suspension Webhooks)**: Does DOKU provide webhook events notifying the platform if a sub-account is suspended or flagged for high chargeback risk?

### Recommendation
Treat Dependencies 1–4 as external clarification items. The MENUIN implementation architecture will handle these gracefully by archiving full Tier 2 outlet address data locally on the platform, providing operational manual status overrides in the Admin Panel, and decoupling internal approval from provider status.

---

## Decision 20: 3-Pillar Verification Architecture & Decoupled Settlement Accounts

### Context
In business verification for QRIS Payment Gateway, coupling bank accounts directly inside the legal entity profile caused operational friction:
1. Multiple branch outlets under one legal entity often require distinct settlement bank accounts (e.g. branch-specific bank accounts), while still sharing the same legal entity NPWP/NIB/KTP.
2. Changing or adding a bank account should never invalidate or re-trigger verification of verified legal corporate documents.
3. Outlets must submit physical evidence (address, coordinates, storefront photo, and cashier indoor photo) to comply with Bank Indonesia / DOKU merchant onboarding requirements, but shouldn't have to re-upload legal documents if their business profile is already verified.

### Decisions
1. **Decouple into 3 Standalone Verification Pillars**:
   - **Pilar 1: Profil Legal Bisnis (`business_profiles`)**: Entity legal identity, NPWP, NIB, KTP, Akta. Reusable across all outlets under the account once verified.
   - **Pilar 2: Rekening Settlement (`settlement_accounts`)**: Dedicated bank account entity for QRIS settlement funds. Belongs to a business profile, supports `is_default: true` flag and per-outlet override (`tenants.settlement_account_id`). Verification status decoupled from legal docs. Number masking (`•••••• 1234`) and strict RBAC enforced.
   - **Pilar 3: Kepatuhan Fisik Outlet (`tenants`)**: Per-outlet physical compliance including address, Google Maps auto-parsed coordinates, storefront photo, and cashier area photo (`indoor_photo_url`). Mandatory for every new outlet.
2. **Settlement Fund Flow Model: Direct Settlement Sweep**:
   - DOKU automatically sweeps settled QRIS funds into the merchant's verified bank account on a daily cycle (T+1/T+2).
3. **Verification Method: Hybrid Multi-Tier Verification**:
   - Token overlap + Levenshtein fuzzy name matching (0–100 score) between KTP/NIB and Bank Account Name.
   - Buku Tabungan / M-Banking Screenshot KYC Document review by compliance admin.
   - Secure signed URLs (TTL 60s) for viewing document proofs.

### Status
**Implemented & Verified.** Schema migrated, service layer actions implemented, Merchant UI rewritten into 3 tabs, Admin console updated, and automated test suite passed (180 tests).

---

## Decision 21: Menuin Visual Identity Standard for Verification Hub & Human-Friendly Copywriting Standards

### Context
To align the business verification experience with Menuin's core product design system (established in the Reports & Analytics module) and eliminate technical gateway jargon that confuses merchants.

### Decisions
1. **Pillar Card Visual Identity**:
   - **Icon Container**: Solid circular shape (`rounded-full`) with solid Menuin Royal Blue (`#0e59f9`) background, containing a crisp white icon (`text-white`). Replaced previous square tinted backgrounds.
   - **Status Indicator**: Filled emerald green circle with white checkmark (`CircleCheck` with `fill-emerald-500 text-white`) for verified pillars.
   - **Card Border & Background**: Pure white `#FFFFFF` surface with `#EAEFF8` border. No distracting hover animations, shadow pop, or border color shifts, maintaining a calm and professional fintech appearance.
2. **Human-Friendly Terminology Rebranding (Bans on Technical Gateway Jargon)**:
   - **Hero Card Status**: Replaced technical gateway copy (`STATUS PEMBAYARAN` / `QRIS Dinamis Aktif`) with merchant-friendly business status:
     - Eyebrow: `STATUS VERIFIKASI`
     - Title: `Bisnis Terverifikasi`
     - Badge/Pill: `Terverifikasi` (emerald)
     - Description: `Profil usaha, perwakilan bisnis, rekening, dan lokasi gerai Anda telah terverifikasi. Transaksi kasir dan pembayaran nontunai siap digunakan.`
   - **Progress Card Timeline**:
     - Heading: `Progres Verifikasi Bisnis` (previously `Progres Aktivasi Pembayaran`)
     - Milestone 3: `Bisnis Terverifikasi Penuh` (previously `Aktivasi QRIS Dinamis Otomatis`)
     - Description: `Seluruh data legalitas dan kepatuhan telah disetujui. Gerai Anda siap menerima transaksi kasir.`
   - **Page Header**:
     - Description: `Kelola data legalitas bisnis, perwakilan, rekening penampungan dana, dan kepatuhan lokasi gerai untuk verifikasi operasional outlet.`
   - **Sub-sidebar Subtitle**:
     - `Legalitas & kepatuhan gerai` (previously `Aktivasi pembayaran QRIS`).
3. **Zero Emoticons Policy**:
   - Strict ban on emojis/emoticons across all labels, alerts, modals, badges, and guidelines. Only clean, functional Lucide icons used where functionally necessary.

### Status
**Implemented & Verified.** Updated in `pillar-card.tsx`, `progress-card.tsx`, `ui-status.ts`, `ringkasan-client.tsx`, and `verification-nav.tsx`.

---

## Decision 22: Wizard Onboarding UI Overhaul: Open Canvas, Compact Upload Zones, Menuin Stepper with Progress Bar, and Preview Mode

### Context
Feedback on the verification wizard indicated that the layout felt like "AI slop" with overly rounded floating cards causing height constraint overflow bugs (e.g. upload dropzones overflowing the card container and covering action buttons). Furthermore, merchants needed the ability to click ahead to subsequent steps to inspect required documents in advance without being able to submit them prematurely, and the stepper required a Menuin/Xendit timeline aesthetic with a top progress bar.

### Decisions
1. **Open Canvas Architecture (No Floating Card Boxes)**:
   - Eliminated the floating bordered card container (`max-w-2xl bg-white rounded-2xl border`).
   - Center area is now an open, full-height white canvas (`bg-white`) with clean vertical padding.
   - Action buttons (`Kembali` & `Simpan & Lanjutkan`) are docked in a sticky bottom footer bar (`h-16 border-t border-[#EAEFF8] bg-white`), guaranteeing buttons never clash with form content.
2. **Compact Horizontal File Upload Zones (Xendit Style)**:
   - Replaced bulky 140px vertical dropzone boxes with sleek horizontal cards (`h-14` or auto-fit with icon on left, file requirements in center, and outline button `Pilih File` on right).
   - Prevents vertical height bloat and eliminates overflow issues completely.
3. **Clean Enterprise Input Elements**:
   - Replaced over-rounded inputs (`rounded-xl` / `rounded-2xl`) with clean fintech standard `rounded-lg` and `border-slate-300` styling.
4. **Step Previewability for Incomplete Steps (`isPreviewOnly`)**:
   - Merchants can click any subsequent step (Steps 2..5) at any time from the left stepper to preview required fields and documents.
   - When viewing an incomplete upcoming step (`currentStep > firstIncompleteStep`):
     - An informational amber banner indicates preview mode.
     - All input fields, entity selectors, and file dropzones are rendered in disabled/read-only mode.
     - The bottom action button dynamically switches to `Buka Langkah X untuk Melengkapi` (pointing to `firstIncompleteStep`).
5. **Menuin Timeline Stepper & Progress Bar Consistency**:
   - **Progress Bar strictly tied to `completedSteps`**: Badge progres `X dari 5 selesai` dan garis biru Menuin hanya bergerak jika suatu langkah benar-benar telah diselesaikan (`completedSteps.length / 5 * 100`). Jika pengguna melihat/preview langkah ke-2 sementara langkah ke-1 belum selesai, nomor langkah aktif menjadi biru namun badge tetap `0 dari 5 selesai`.
   - **Indikator Ceklis & Penomoran Konsisten**:
     - Langkah yang sudah selesai menggunakan lingkaran biru Menuin (`bg-[#0e59f9] text-white`) dengan ikon centang (`✓` / `Check`), bukan nomor. Garis penghubung ke langkah berikutnya berwarna biru Menuin.
     - Langkah yang sedang aktif menggunakan lingkaran biru Menuin bernomor (`bg-[#0e59f9] text-white`) bersih tanpa efek lingkaran/halo biru muda di sekitarnya dan tanpa latar belakang kotak biru muda.
     - Langkah yang belum selesai dan tidak aktif menggunakan lingkaran outline abu-abu (`border-2 border-slate-200 text-slate-400 bg-white`) dengan nomor langkah.
   - **Panjang Garis Penghubung Progresif & Ketebalan Ramping (1px)**:
     - Garis penghubung vertikal antar-tahapan menggunakan ketebalan ramping 1px (`w-px`) agar terlihat halus, elegan, dan identik dengan kartu verifikasi di halaman hub.
     - Panjang garis bertingkat secara dinamis: Langkah 1 (`h-7` / 28px) -> Langkah 2 (`h-11` / 44px) -> Langkah 3 (`h-16` / 64px) -> Langkah 4 (`h-22` / 88px).
   - **Pembersihan Elemen Non-Esensial**: Menghilangkan seluruh badge `"Lihat"` dan ikon mata agar tampilan bersih, tenang, dan konsisten dengan antarmuka Menuin.

### Status
**Implemented & Verified.** Updated in `wizard-stepper.tsx`, `wizard-shell.tsx`, `upload-zone.tsx`, and all step components. Verified via browser subagent.

---

## Decision 23: Enterprise Form Radius Standardization (Strict 6px/4px Rule) & Mandatory Installed Skill Protocol

### Context
User feedback highlighted that the verification form field inputs and buttons appeared amateurish and lacked enterprise polish due to being "terlalu rounded" (inherited from Tailwind `rounded-lg` which evaluated to 12px via `var(--radius): 0.75rem`). The reference enterprise fintech screenshots (Xendit) demonstrated that crisp, clean, professional SaaS interfaces use disciplined, subtle corner rounding (`4px` to `6px`) instead of bubbly pill curves.
Additionally, the user mandated that for all current and future engineering and design tasks, the assistant MUST actively invoke and adhere to installed agent skills (`.agents/skills/` such as `design-taste-frontend`, `ui-ux-pro-max`, `high-end-visual-design`, `impeccable`), and this requirement must be permanently documented in the project's Source of Truth (SSOT).

### Decisions

#### 1. Form Radius Standardization (Strict 6px/4px Hierarchy)
- **Primary Form Inputs & Textareas**: Strictly styled with `rounded-[6px]`. Banned `rounded-lg` (12px), `rounded-xl` (16px), or `rounded-2xl` on text inputs, textareas, selects, and entity buttons.
- **Selection Cards & Profile Tiles**: Replaced bubbly `rounded-lg` containers with crisp `rounded-[6px]` borders (`border-slate-200` with subtle `hover:border-slate-300`).
- **Inner Buttons & Status Badges**: Secondary nested action buttons (e.g. `Pilih File`, modal toggles) and status pill chips use `rounded-[4px]`.
- **Primary Action Buttons**: Docked footer action buttons (`Kembali`, `Simpan & Lanjutkan`) and top bar actions (`Simpan & Keluar`) use `rounded-[6px]` with clean enterprise heights (`h-9` / 36px) and subtle typography.
- **Sidebar & Stepper Immobility**: As instructed by the user, the left sidebar and stepper layout remain untouched.

#### 2. Mandatory Skill Utilization Protocol (SSOT)
In every single task and iteration, the assistant must consult and apply relevant installed skills in `.agents/skills/`:
- **`design-taste-frontend`**: Anti-slop frontend discipline; bans generic templates, pill forms, lazy layouts, and unstyled defaults.
- **`ui-ux-pro-max`**: Design intelligence for web & mobile interfaces, enterprise fintech palettes, precise typography hierarchy, and UX micro-interactions.
- **`high-end-visual-design`**: Geometric precision, calibrated spacing, subtle shadows, avoiding cheap bubble UI.
- **`impeccable`**: Frontend polish, strict visual hierarchy, accessibility, and zero-compromise design craftsmanship.
- **`humanizer`**: Empathetic, human-centered UX copy without robotic jargon or corporate buzzwords.

### Status
**Implemented & Verified.** Standardized across all verification wizard steps (`step-1-business-profile.tsx`, `step-2-representative.tsx`, `step-3-settlement.tsx`, `step-4-outlet.tsx`, `step-5-review.tsx`), `upload-zone.tsx`, `guideline-panel.tsx`, and `wizard-shell.tsx`.

---

## Decision 24: Direct-Click Full-Surface Upload Dropzone (Removal of Redundant 'Pilih File' Button)

### Context
To streamline usability and remove cognitive friction, the user requested eliminating the separate nested "Pilih File" button from upload cards. Previously, merchants had to aim for a small 80px button on the right edge of the upload card. Making the entire upload component container clickable (`cursor-pointer`) allows merchants to tap anywhere on the component to select their file.

### Decisions
1. **Full-Surface Tap Target**:
   - The entire `UploadZone` container is transformed into an interactive element with `role="button"`, `tabIndex={0}`, keyboard trigger (`Enter` / `Space`), and full container `onClick` opening the file picker.
   - Removed the nested, redundant `<button>Pilih File</button>`.
2. **Interactive Hover & Drag Feedback**:
   - Empty state: Added `group`, `hover:border-slate-400 hover:bg-slate-50/50`, and icon background transition (`group-hover:bg-[#0e59f9] group-hover:text-white`).
   - Drag-over state: Highlights with border `#0e59f9` and background `bg-blue-50/50`.
   - Disabled/preview state: Preserves `cursor-not-allowed` and blocks input clicks.
3. **Attached File Actions Isolation**:
   - When a file is already uploaded, clicking the card opens the file chooser to replace the file.
   - Clicking the delete button ("Hapus" / X) uses `e.stopPropagation()` so deleting a file never accidentally opens the file picker dialog.
4. **Universal Application**:
   - Since `UploadZone` is the shared component used across all wizard steps (Step 1 NIB/NPWP, Step 2 KTP, Step 3 Buku Tabungan, Step 4 Foto Gerai & Kasir), all upload zones across the entire verification flow immediately benefit from this clean, direct interaction pattern.

### Status
**Implemented & Verified.** Updated in `upload-zone.tsx` and verified across all steps.

---

## Decision 25: Searchable Enterprise Dropdown for Legal Entity Selection (Clean Flat List Specification)

### Context
In Step 1 (Profil Usaha), the business legal entity selector was refined into a dedicated, searchable enterprise dropdown. Based on user UX feedback, the options list was streamlined to a clean, flat list without category headers or description subtitles. The active selection styling was calibrated to remain neutral—avoiding blue/purple text or background fills, and utilizing only a crisp black checkmark (`✓`) matching the option text.

### Decisions
1. **Dedicated Searchable Combobox Component (`EntityDropdown`)**:
   - Implemented in `apps/web/src/components/verification/shared/entity-dropdown.tsx`.
   - Eliminates generic Radix Select portal positioning and pointer-event freezing bugs.
2. **Clean Minimalist List Structure**:
   - **Trigger**: Height `h-10` (40px), `rounded-[6px]`, `border-slate-300`, and `ChevronsUpDown` (`↕`) dual-arrow icon.
   - **Search Header**: Compact search bar with `Search` icon, live text input, and `X` clear button.
   - **Flat Options (No Categories, No Subtitles)**: Direct choices for *Perorangan*, *Perseroan Terbatas (PT)*, *Persekutuan Komanditer (CV)*, *Koperasi*, and *Yayasan*.
   - **Neutral Active State**: Selected item retains standard dark text (`text-slate-800`) and neutral background without blue fills, displaying a sharp black checkmark (`text-slate-900`) for active confirmation.
3. **Seamless State Sync & Review Mapping**:
   - Integrated with `step-1-business-profile.tsx` form state.
   - Preserved `ENTITY_LABEL_MAP` in `step-5-review.tsx` for clean human labels in the final review step.

### Status
**Implemented & Verified.** Updated in `entity-dropdown.tsx`, `step-1-business-profile.tsx`, and verified in live browser.

---

## Decision 26: Removal of "Mode Pratinjau Dokumen" Warning Banner & Field-Level Click Sonner Toast Guard

### Context
Merchants need to freely inspect upcoming wizard steps (e.g. Step 2 KTP, Step 3 Rekening, Step 4 Gerai) to see all required documents, field formats, and guidelines in advance. However, the previous implementation rendered an intrusive yellow alert banner ("Mode Pratinjau Dokumen") at the top of the form. The user requested removing this warning banner completely, allowing unrestricted tab switching so merchants can review requirements, while preventing data entry and triggering an informative Sonner toast whenever a field on an incomplete step is clicked.

### Decisions
1. **Unrestricted Step Browsing**:
   - Merchants can freely click any step in the stepper timeline (`WizardStepper`) to inspect what data and documents are required.
   - Removed step-switch blockers from `WizardStepper`.
2. **Elimination of Intrusive Warning Banner**:
   - Completely eliminated the yellow "Mode Pratinjau Dokumen" banner from the form canvas in `wizard-shell.tsx`. The interface remains pristine and distraction-free.
3. **Field-Level Click Interception & Sonner Toast Alert**:
   - When viewing an incomplete preview step (`currentStep > firstIncompleteStep`), a transparent overlay covers the form canvas (`z-20 cursor-not-allowed`).
   - Clicking on any field, input, or upload area intercepts the click and triggers an informative Sonner toast:
     `toast.warning("Selesaikan pengisian dokumen Langkah [X] ([Nama Langkah]) terlebih dahulu.")`.
   - Form inputs remain protected from premature input/edits.
4. **Convenient Return Navigation**:
   - When viewing an uncompleted preview step, the bottom action bar displays `Lengkapi Langkah [firstIncompleteStep] ->` allowing one-click return to the active required step.

---

## Decision 27: Business Representative (PIC) Step 2 Design & Data Alignment

### Context
Step 2 ("Perwakilan Bisnis") in the onboarding verification wizard was redesigned to achieve a 1-to-1 match with the user's reference design. The layout needed to present the business owner's personal identity (PIC) clearly with specific input styling, custom dropdown selectors, phone prefix containerization, half-width alignment for NIK and KTP, and an attached upload card.

### Decisions
1. **6-Field Layout & Grid Architecture**:
   - **Row 1 (`Nama Penanggung Jawab`)**: Full width text input with default `Muhammad Zidane Elfasya`.
   - **Row 2 (`Jabatan di Company`)**: Full width dropdown select with `ChevronsUpDown` (`↕`), defaulted to `Pemilik` (options: *Pemilik*, *Direktur Utama*, *Direktur*, *Komisaris*, *Pengurus*, *Kuasa Direksi*).
   - **Row 3 (2-Column Grid)**:
     - Left: `Nomor Telepon` with dedicated country code selector (`62 ↕`) and visual `+62` prefix input (`+62 82235594074`).
     - Right: `Email` text input (`menuindigitalsolusindo@gmail.com`).
   - **Row 4 (`Kewarganegaraan`)**: Full width dropdown select with `ChevronsUpDown` (`↕`), defaulted to `Indonesia` (options: *Indonesia*, *Warga Negara Asing (WNA)*).
   - **Row 5 (`No. KTP (NIK)`)**: Half-width input strictly aligned with Column 1 (`grid-cols-2`), 16-digit mono font (`3510162604030008`).
   - **Row 6 (`Kartu Tanda Penduduk`)**: Half-width upload card strictly aligned with Column 1 (`grid-cols-2`), featuring a dashed border (`border-[#CED3DC]`), light gray background (`#E4E7EC`), crisp thumbnail preview (`/sample-ktp.png`), title `Kartu Tanda Penduduk`, subtitle `Ketuk di sini untuk membuka`, and full-card clickability without redundant buttons.
2. **Design Standards Compliance**:
   - Backgrounds calibrated to `#E4E7EC` with `#CED3DC` borders and subtle `rounded-[6px]`.
   - Typography strictly adheres to Menuin zero-bold standard (`font-semibold` on labels, `font-normal` on inputs).
   - Removed red asterisks (`*`) to mirror the clean reference aesthetic.
3. **End-to-End System Integration**:
   - Pre-populated initial state in `wizard-shell.tsx` with fallback data matching the reference image.
   - Wired document upload and preview management (`ktpPreviewUrl`).
   - Updated validation in `handleNextStep` and submission payload in `createBusinessProfileAction` (`responsiblePersonContact`).
   - Updated `Step5Review` to present all 6 representative fields in the summary review grid.

### Status
**Implemented & Verified.** Updated in `step-2-representative.tsx`, `upload-zone.tsx`, `wizard-shell.tsx`, and `step-5-review.tsx`. Verified with TypeScript `tsc --noEmit`, 41 passing vitest tests, and confirmed visually in the live browser.

---

## Decision 28: Multi-Tenant Business Profile & Settlement Account Isolation (Employee / Manager Boundary)

### Context
In Menuin, an outlet Owner (e.g. "Kopi Jotos") can invite employees (e.g. Cashiers or Managers) by email to register an account and join the outlet workspace.
A critical flaw existed where:
1. If an invited employee with role `MANAGER` accessed the onboarding verification wizard or if seed data linked multiple tenants across user boundaries, business legal profiles and bank accounts belonging to the owner of Kopi Jotos became associated with or visible in the employee's new outlet when that employee later created their own independent outlet.
2. The root causes were:
   - `apps/web/src/app/outlet/[outletKey]/verification/onboarding/page.tsx` allowed `MANAGER` to access the wizard.
   - Server actions (`linkOutletToBusinessProfileAction`, `linkOutletSettlementAccountAction`, `submitOutletComplianceAction`, and `activateOutletPaymentAction`) accepted `role === 'MANAGER'`.
   - `getOutletVerificationOverview` returned `availableProfiles` by checking `WHERE business_profiles.accountId = account.id` without checking if the caller was an `OWNER` of the target outlet, nor validating whether the existing profile link actually belonged to an active owner of the target tenant.
   - `seed-verification.ts` indiscriminately linked the first 3 tenants in the database to `bp1`, cross-linking tenants owned by other test users.

### Decisions
1. **Strict Owner-Only Role Boundary (Option A)**:
   - Only accounts with role `OWNER` (or `SYSTEM_ADMIN`) on the tenant can access the onboarding wizard (`/outlet/[outletKey]/verification/onboarding`).
   - Non-owners (`MANAGER`, `CASHIER`, `STAFF`) are hard-blocked with an informative restriction card: *"Akses Khusus Pemilik (Owner). Pendaftaran profil legal usaha dan rekening penampungan hanya dapat dilakukan oleh pemilik akun outlet."*
2. **Server-Side Enforcement**:
   - `createBusinessProfileAction`, `linkOutletToBusinessProfileAction`, `linkOutletSettlementAccountAction`, `submitOutletComplianceAction`, and `activateOutletPaymentAction` now strictly require `membership.role === 'OWNER'` (or `SYSTEM_ADMIN`). Attempts by `MANAGER` or `CASHIER` are immediately rejected with error 403.
   - `linkOutletToBusinessProfileAction` and `linkOutletSettlementAccountAction` verify that the business profile's `accountId` matches `account.id`.
3. **Defense-in-Depth Query Isolation**:
   - In `getOutletVerificationOverview(outletKey)`:
     - If the caller's role is not `OWNER`, `availableProfiles` strictly evaluates to `[]`.
     - When inspecting an already linked `tenant.businessProfileId`, the query validates that the profile belongs to an active `OWNER` membership of that tenant. If an invalid or foreign profile link is detected, it is automatically detached (`self-heal`), preventing data leakage.
4. **Read-Only Experience for Managers**:
   - Managers can access the Verification Overview (`RingkasanClient`) to monitor verification progress.
   - If user is not `OWNER`, action buttons (`Mulai Verifikasi`, `Tambah Rekening`, `Ubah Data`, `Set Utama`) are hidden or disabled, replaced with a notice: *"Akses Khusus Pemilik (Mode Lihat)"*.
5. **Database Remediation & Seed Fix**:
   - All legacy cross-tenant links where `business_profile_id` was attached to an unowned tenant (e.g. Kopi Asalam, Mie Gacoan, kopi asal) were safely unlinked in the database.
   - `seed-verification.ts` was refactored to only link tenants that have an active `OWNER` membership belonging to `mainAccount.id`.

### Status
**Implemented & Verified.** Updated in `packages/permissions`, `merchant-verification.ts`, `settlement-accounts.ts`, `onboarding/page.tsx`, `ringkasan-client.tsx`, `status-hero-card.tsx`, `business-client.tsx`, `representative-client.tsx`, `settlement-client.tsx`, and `seed-verification.ts`. Full test suites (Vitest) passing with 47/47 tests, zero TypeScript errors.

---

## Decision 29: Elimination of Hardcoded Form Values & Unrestricted Step Preview Browsing

### Context
During verification testing, merchants need to:
1. Start with completely clean forms containing zero hardcoded mock values (no prefilled names, phone numbers, NIKs, sample KTP images, pre-selected banks, or legacy seed addresses), relying purely on clean, descriptive placeholder hints.
2. Freely click any step in the stepper timeline (`WizardStepper`) to inspect what documents and legal data will be required ahead of time (as established in Decision 26).

### Decisions
1. **Zero Default Values (Placeholder-First Architecture)**:
   - Initial states for all wizard steps (`representativeFormData`, `settlementFormData`, `outletFormData`, `uploadedDocs`, and `docPreviews`) start completely blank (`''`, `{}`, `null`).
   - Replaced all specific names/numbers in input placeholders with standard generic guides (e.g. `Contoh: Budi Santoso`, `Contoh: 1234567890 (hanya angka)`, `Contoh: 3510xxxxxxxxxxxx (16 digit)`).
   - Dropdown selectors (Bentuk Entitas, Jabatan, Kewarganegaraan, Pilihan Bank) start unselected with explicit placeholder prompts (`Pilih bentuk entitas usaha...`, `Pilih jabatan di perusahaan...`, `Pilih bank settlement...`).
   - Legacy seed address fields on unverified tenants in the database are cleared (`NULL`) so the outlet compliance form starts clean.
2. **Unrestricted Step Preview Browsing**:
   - The stepper timeline (`WizardStepper`) allows clicking on any step at any time (`onStepClick={setCurrentStep}`).
   - All step icons and labels remain clickable (`cursor-pointer hover:bg-slate-50/80`) without premature blockers or disabled styles.
   - When a merchant navigates to an incomplete step (`currentStep > firstIncompleteStep`):
     - The step is displayed in read-only preview mode so the merchant can inspect required documents, fields, and guidelines.
     - Attempting to interact with an input in preview mode intercepts the click and displays a helpful Sonner toast: *"Selesaikan pengisian dokumen Langkah [X] ([Nama]) terlebih dahulu."*
     - The footer action bar displays `"Lengkapi Langkah [X] ->"`, enabling immediate one-click return to the active required step.

### Status
**Implemented & Verified.** Updated in `wizard-shell.tsx`, `wizard-stepper.tsx`, `step-1-business-profile.tsx`, `step-2-representative.tsx`, `step-3-settlement.tsx`, `step-4-outlet.tsx`, `nationality-dropdown.tsx`, and `tenants` DB table. Verified with `npx tsc --noEmit` and browser subagent tests.

---

## Decision 30: UI/UX Standardization of Dropdown Architecture (Source of Truth for Modern Combobox Pattern)

### Context
During verification testing, the dropdown for "Jabatan di Company" and the country code selector in Step 2 ("Informasi Perwakilan Bisnis") were rendered using legacy native HTML `<select>` elements styled with an absolute `ChevronsUpDown` icon overlay. This created severe visual and behavioral inconsistency:
1. Native `<select>` elements appear outdated ("kuno"), vary across operating systems and browsers, and break the high-end custom aesthetic of the MENUIN verification suite.
2. In contrast, "Bentuk Entitas Usaha" (`EntityDropdown`) in Step 1, "Kewarganegaraan" (`NationalityDropdown`) in Step 2, "Bank Settlement" (`BankDropdown`) in Step 3, and "Provinsi/Kota/Kecamatan" (`SearchableDropdown`) in Step 4 utilize modern, search-filtered popover comboboxes with animated micro-interactions, clean hover states, and checkmark indicators.
3. Phone number input previously paired a native `<select>` containing `"62"` alongside a redundant floating `+62` label inside the input field, creating visual clutter and confusing duplication.

To maintain strict UI/UX consistency, eliminate AI-slop / legacy markup, and ensure that all current and future engineering work follows a single design standard, the Dropdown Design System is codified directly into the project's Source of Truth.

### Architectural Standard & UI/UX Specifications

All selection inputs across the MENUIN Verification Wizard and associated dashboards MUST adhere to the following unified design token specifications:

1. **Zero Native `<select>` Rule**:
   - Native HTML `<select>` elements are strictly prohibited in the verification suite.
   - All dropdowns must use the standardized custom popover combobox architecture.

2. **Trigger Button Standard**:
   - Height and Shape: `h-10 rounded-[6px] border px-3.5`
   - Typography: `text-sm font-normal font-sans` (strictly adhering to the MENUIN zero-bold standard where input values and placeholders use `font-normal`, reserving `font-semibold` exclusively for field labels).
   - Layout: `w-full text-left flex items-center justify-between transition-colors shadow-none select-none`
   - Default Idle State: `border-slate-300 bg-white text-slate-900 hover:border-slate-400 cursor-pointer`
   - Active / Open State: `border-[#0e59f9] ring-1 ring-[#0e59f9] bg-white text-slate-900 cursor-pointer`
   - Disabled State: `border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed`
   - Empty State / Placeholder: `truncate text-slate-400 font-normal font-sans` (e.g. `"Pilih jabatan di perusahaan..."`)
   - Affordance Icon: `ChevronsUpDown className="w-4 h-4 text-slate-400 flex-shrink-0 ml-2"`

3. **Popover Panel Standard**:
   - Positioning: `absolute top-full left-0 right-0 mt-1 z-50`
   - Container Styling: `bg-white border border-slate-200 rounded-[6px] shadow-lg overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100 font-sans`
   - Click-Outside & Keyboard Escape Handling: Automatically dismisses panel on outside mouse down or `Escape` key press.

4. **Search Header Standard**:
   - Row Container: `p-2.5 border-b border-slate-100 flex items-center gap-2 bg-white`
   - Search Icon: `Search className="w-4 h-4 text-slate-400 flex-shrink-0"`
   - Search Input: `w-full text-xs font-normal text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent font-sans` with auto-focus on open.
   - Clear Action: `X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 cursor-pointer flex-shrink-0"` when query is non-empty.

5. **Option Items & Selection State**:
   - List Container: `max-h-60 overflow-y-auto p-1 no-scrollbar space-y-0.5`
   - Item Styling: `px-2.5 py-2 rounded-[4px] text-xs text-slate-800 hover:bg-slate-50 hover:text-slate-900 transition-colors flex items-center justify-between cursor-pointer font-sans`
   - Selected Indicator: Neutral dark checkmark `<Check className="w-4 h-4 text-slate-900 stroke-[2] flex-shrink-0 ml-2" />`. No heavy background badges or neon highlights.
   - Empty Result Notice: `px-3 py-6 text-center text-xs text-slate-400 font-sans` (e.g. `Tidak ada pilihan yang cocok dengan "..."`).

6. **Component Registry Mapping**:
   | Step | Field | Standardized Component | Path |
   | :--- | :--- | :--- | :--- |
   | Step 1 | Bentuk Entitas Usaha | `EntityDropdown` | `components/verification/shared/entity-dropdown.tsx` |
   | Step 2 | Jabatan di Company | `PositionDropdown` | `components/verification/shared/position-dropdown.tsx` |
   | Step 2 | Kewarganegaraan | `NationalityDropdown` | `components/verification/shared/nationality-dropdown.tsx` |
   | Step 3 | Bank Settlement | `BankDropdown` | `components/verification/shared/bank-dropdown.tsx` |
   | Step 4 | Provinsi, Kota/Kabupaten, Kecamatan | `SearchableDropdown` | `components/verification/shared/searchable-dropdown.tsx` |

7. **Phone Input Country Code Standard**:
   - Replaced redundant native select and floating overlay with a clean, dedicated prefix badge:
     `<div className="w-14 h-10 rounded-[6px] border border-slate-300 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-700 select-none flex-shrink-0">+62</div>`
   - Paired with standard input: `className="w-full h-10 rounded-[6px] border border-slate-300 bg-white px-3.5 text-sm font-normal text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#0e59f9] focus:ring-1 focus:ring-[#0e59f9] transition-colors"`.

### Status
**Implemented & Verified.** Created `position-dropdown.tsx`, updated `step-2-representative.tsx`, eliminated 100% of native `<select>` tags in verification wizard, and verified via `npx tsc --noEmit`.

---

## Decision 31: Global Interactive Lock & Upload Loading Guard (Bug & Race Condition Prevention)

### Context
During verification testing, when an image or legal document upload was in progress (`isUploading === true`), interactive controls across the screen (including "Simpan & Lanjutkan", "Kembali", "Simpan & Keluar", stepper navigation items, and other form fields/buttons) remained clickable. This created risks of:
1. **Race Conditions & Incomplete Payloads**: Clicking "Simpan & Lanjutkan" while an upload was in-flight submitted incomplete storage keys or partial form data, resulting in compliance submission errors.
2. **State Corruption & Interrupted Uploads**: Clicking another step on the stepper or clicking "Kembali" navigated away mid-upload, aborting network requests or leaving orphaned files.
3. **Premature Exit**: Clicking "Simpan & Keluar" navigated to the overview page before the newly uploaded document key was attached to the profile state.

The user explicitly requested that all buttons and interactive controls across the entire screen must be strictly disabled and unclickable while an upload is in progress to prevent system bugs and operational errors.

### Architectural Standard & UI/UX Specifications

Whenever a document upload action is executed in the MENUIN Verification Wizard, the application enters an isolated locked state (`isUploading === true`):

1. **Footer Action Lock**:
   - `Kembali` button is strictly disabled: `disabled={currentStep === 1 || isSubmitting || isUploading}` with `disabled:opacity-40 disabled:cursor-not-allowed`.
   - `Simpan & Lanjutkan` / `Kirim Pengajuan Verifikasi` button is disabled: `disabled={isSubmitting || isUploading || (currentStep === 5 && !isAgreed)}`.
   - Dynamic Upload Indicator: While `isUploading` is true, the primary button label switches from "Simpan & Lanjutkan" to:
     `<Loader2 className="w-4 h-4 animate-spin text-white" /> <span>Mengunggah Dokumen...</span>`
     providing clear, immediate visual confirmation of the asynchronous upload process.
   - `Lengkapi Langkah [X]` button in preview mode is disabled: `disabled={isUploading || isSubmitting}` with `cursor-not-allowed`.

2. **Header Action Guard**:
   - `Simpan & Keluar` replaces the active Next.js `<Link>` with a disabled `<button disabled className="cursor-not-allowed opacity-60">`, strictly preventing abandonment of the wizard while an upload request is in-flight.

3. **Stepper Timeline Lockdown**:
   - `WizardStepper` receives `disabled={isUploading || isSubmitting}`.
   - All step buttons within the stepper timeline are disabled (`disabled={disabled}`, `cursor-not-allowed opacity-60`), and click events are ignored.

4. **Form Canvas Event Interception**:
   - In `wizard-shell.tsx`, `onClickCapture` intercepts any click attempts on the form canvas during `isUploading`, calling `e.preventDefault()`, `e.stopPropagation()`, and notifying the user via a Sonner toast:
     `toast.info('Mohon tunggu, proses upload dokumen sedang berlangsung...')`.

5. **Component-Level Input & Upload Zone Lockdown**:
   - All form inputs, dropdowns (`EntityDropdown`, `PositionDropdown`, `NationalityDropdown`, `BankDropdown`, `SearchableDropdown`), and textareas across Steps 1 through 4 are marked `disabled={isPreviewOnly || isUploading}`.
   - In `UploadZone` (`upload-zone.tsx`):
     - Empty dropzones display an active spinner (`<Loader2 className="animate-spin text-[#0e59f9]" /> Mengunggah file...`) and apply `cursor-not-allowed opacity-60`.
     - Attached document cards disable the thumbnail view button (`upload-thumb-btn`), file name button (`upload-filename-btn`), replace button (`upload-replace-btn`), and delete button (`upload-remove-btn`) when `isUploading` is active.
   - In `Step5Review` (`step-5-review.tsx`), all "Ubah" jump-to-step buttons and the declaration checkbox are disabled during `isUploading`.

### Status
**Implemented & Verified.** Updated in `upload-zone.tsx`, `wizard-stepper.tsx`, `wizard-shell.tsx`, `step-1-business-profile.tsx`, `step-2-representative.tsx`, `step-3-settlement.tsx`, `step-4-outlet.tsx`, and `step-5-review.tsx`. Verified with TypeScript `tsc --noEmit` and passing vitest test suite.

---

## Decision 32: Verification Flow V2 — Single ACID Submission & Honest Stepper Status

### Context
In previous iterations, the verification onboarding wizard suffered from state disconnections:
1. When an admin rejected an individual field or document (e.g. NIB or bank account), returning to the wizard showed all stepper icons as green checkmarks (`completed`), falsely indicating to the merchant that everything was fine.
2. Step 1 locked into a static summary card when a profile existed, with no avenue to edit rejected fields or re-upload legal documents.
3. Steps 2 and 4 lost fields (representative position, email, nationality; outlet province, district) because columns were missing from database tables and schema mappings.
4. Uploaded documents (KTP, NIB, NPWP, outlet photos) were not hydrated on reload, giving the impression that documents vanished.
5. Final submission triggered up to 5 uncoordinated sequential client calls, risking partial database state failures.

### Architectural Standard & UI/UX Specifications

1. **Additive Schema & Persistence Foundation**:
   - `business_profiles`: Added `responsible_person_position`, `responsible_person_email`, `responsible_person_nationality`.
   - `tenants`: Added `province`, `district`.
   - Created `verification_drafts`: On-conflict upsert storing `current_step` and JSON `payload` by `tenant_id`.
   - Created `verification_section_reviews`: Tracks section-level review status (`APPROVED`, `CHANGES_REQUESTED`, `INHERITED`, `PENDING`) with notes and flagged fields for `BUSINESS_PROFILE`, `REPRESENTATIVE`, `SETTLEMENT`, and `OUTLET`.

2. **Single ACID Server Action (`submitVerificationApplicationAction`)**:
   - Executes inside a single PostgreSQL database transaction:
     - Upserts/links `business_profiles`.
     - Creates/links `settlement_accounts`.
     - Updates `tenants` physical compliance data (`address`, `province`, `city`, `district`, `postalCode`, `latitude`, `longitude`, `mapsUrl`).
     - Inserts 1 unified `verification_submissions` record (scope: `APPLICATION`).
     - Inserts `verification_documents` with carried-over `ACCEPTED` statuses.
     - Initializes `verification_section_reviews`.
     - Deletes active draft and writes audit log.

3. **Honest Stepper Status Engine (`stepStatuses`)**:
   - Replaced naive `completedSteps` length checks with `deriveStepStatus`:
     - `changes_requested`: Renders an amber warning circle with exclamation icon (`AlertCircle`), amber border, and a "Perlu Perbaikan" badge.
     - `approved`: Renders a green circle with `Check` icon and "Disetujui" badge.
     - `complete`: Renders a blue circle with `Check` icon.
     - `incomplete`: Renders standard slate border with step number.
   - All steps remain clickable so merchants can review requirements and navigate directly to rejected sections.
   - Top banner alerts merchant with direct jump links to sections needing revision.

4. **Complete Hydration Hierarchy & UploadZone Retention**:
   - Wizard state hydrates in order: `draft.payload` -> `latestSubmission` -> `businessProfile` / `tenant` -> placeholder defaults.
   - `uploadedDocs` hydrates from `latestSubmission.documents`, retaining `storageKey`, `fileName`, `fileSizeBytes`, `reviewStatus`, and `reviewNote`.
   - `UploadZone` renders previous documents with preview and replace actions, displaying a prominent amber warning alert when `reviewStatus === 'REJECTED'`.

### Status
**Implemented & Verified.** Database migration applied cleanly (`npm run db:sync -- --apply`). All server actions and client wizard components updated and validated with `npx tsc --noEmit` and passing vitest test suite.

---

## Decision 33: Granular Admin Review Console & Lifecycle Reopen

### Context
Admins needed an ergonomic review console that accurately mirrors the merchant wizard structure, provides clear granular feedback, and prevents fraud without permanently blocking merchants who made innocent mistakes.

### Architectural Standard & UI/UX Specifications

1. **4 Sequential Section Review Cards**:
   - Directly maps to the merchant wizard order:
     1. Profil Usaha & Legalitas
     2. Informasi Perwakilan Bisnis
     3. Rekening Settlement Bank
     4. Lokasi & Kepatuhan Fisik Gerai
   - Each card features a prominent status toggle: `[✓ Sesuai]` vs `[✗ Perlu Perbaikan]`.
   - Rejection requires an explicit note and offers quick-select checklist tags.
   - Per-document review controls allow accepting or rejecting specific files.

2. **Automated Rollup Decision Engine**:
   - If all 4 sections are `APPROVED`: Decision automatically sets to `APPROVE`.
   - If any section is `CHANGES_REQUESTED`: Decision automatically sets to `REQUEST_CHANGES` and auto-compiles summary feedback.
   - "Tolak Permanen" is reserved for severe fraud, locking self-service resubmission.

3. **Lifecycle Reopening by Admin / CS (`adminReopenVerificationAction`)**:
   - While permanently rejected merchants cannot re-submit on their own, System Admins and Customer Support have an explicit "Buka Kembali Pengajuan" action.
   - Unlocks the merchant's onboarding access and resets status to `action_required` with an audit log record.

4. **Queue Modernization (`AppTable`)**:
   - Replaced raw HTML table in `admin-verification-queue-client.tsx` with standard Menuin `AppTable`.
   - Added "Progres Bagian" column rendering status chips for Profil, PIC, Bank, and Gerai (`✓`, `✗`, `⏳`).

### Status
**Implemented & Verified.** Updated `admin-verification-queue-client.tsx` and `admin-verification-detail-client.tsx`. Verified with zero compilation errors and all tests passing.

---

## Decision 34: Verification Wizard Polish — Clean Stepper, Inline Alert Tooltips & Responsive Update Feedback

### Context
User feedback highlighted several UX friction points in the verification wizard during revision flows:
1. **Redundant Sidebar Badges**: The "Perlu Perbaikan" badge in the sidebar stepper header and step items was visual noise because the amber circle icon already sufficiently signaled revision.
2. **Cluttered Field Warning Boxes**: The prominent yellow alert box placed under fields and the "Perlu Diunggah Ulang" badge inside file cards caused excessive vertical layout shift and visual clutter.
3. **Lack of Instant Feedback on Input**: When users uploaded replacement documents or filled new inputs, the error badges remained static until complete submission, causing uncertainty whether new data was registered.

### Architectural Standard & UI/UX Specifications

1. **Clean Sidebar Progress Bar**:
   - Removed all textual "Perlu Perbaikan" badges from the stepper header and step item list.
   - Preserved the clean amber circle with `AlertCircle` icon as the sole, elegant indicator of steps requiring changes.
   - Header consistently displays `{finishedCount} dari 5 selesai`.

2. **Inline Alert Icon with Hover Tooltip**:
   - Replaced the large yellow box under fields with an amber `AlertCircle` icon on the right side of the field label and inside the attached file card.
   - Hovering or focusing on the alert icon reveals a floating dark tooltip (`Catatan Perbaikan: {reviewNote}`) positioned without clipping (`z-50`, `bottom-full mb-1.5`).
   - Removed the `Perlu Diunggah Ulang` badge from file cards.

3. **Immediate Data Update Feedback**:
   - Tracked replacement state with `isNewlyUpdated` on `uploadedDocs` and `modifiedSections` in `wizard-shell.tsx`.
   - When a user enters new input or re-uploads a file for a flagged field/document:
     - Renders an emerald pill badge: `Data Baru Diperbarui` with `CheckCircle2`.
     - Automatically transitions the step status from `changes_requested` to `complete` (blue checkmark).
     - Renders a top success banner: `Seluruh Data Perbaikan Telah Diperbarui` when all flagged items have been corrected, guiding the user directly to Step 5 (Review).

### Status
**Implemented & Verified.** Updated `wizard-stepper.tsx`, `upload-zone.tsx`, `step-1-business-profile.tsx`, `step-2-representative.tsx`, `step-3-settlement.tsx`, `step-4-outlet.tsx`, and `wizard-shell.tsx`. Verified via live browser subagent, typecheck (`tsc --noEmit`), and vitest suite.

---

## Decision 35: Granular 4-Pillar Decoupling, Subsidebar Image Storage & Display, Card-Level Verified Fill Checkmark & Alert Icon, Admin Field-Level Manual Verification, and Menuin UI/UX Standards

### Context
User feedback and architectural review revealed key issues in the verification system:
1. **False-Positive "Perlu Revisi" on Profil Usaha**:
   When an admin rejected only the representative (PIC) in `/system-admin/verification/[id]`, the business profile entity status became `action_required`. In the verification hub (`Ringkasan`), both Profil Usaha and Perwakilan cards showed `Perlu Revisi` due to tight coupling (`repStatus = bpStatus;`), confusing the merchant into thinking their company legal docs (NIB/NPWP) were rejected.
2. **Missing Document & Image Previews in Subsidebar Detail Pages**:
   The subsidebar pages (`/verification/business`, `/representative`, `/outlet`) showed empty placeholders ("Belum ada berkas dokumen yang terlampir pada pengajuan ini", "Foto belum diunggah") because queries filtered on legacy scope `BUSINESS_PROFILE` instead of unified `APPLICATION`, and outlet photo storage keys were not reliably synchronized.
3. **Card-Level Status Indicators (Right-Aligned with Form Title)**:
   Users need immediate clarity in detail pages regarding whether section data is verified or requires revision, specifically requesting a filled green checkmark icon when verified, and an alert icon when data contains errors.
4. **Admin Manual Verification of Critical Form Text Fields**:
   Admin review console previously only allowed accepting/rejecting document attachments, leaving critical text fields (NIB, NPWP, NIK, etc.) without granular verification flags.
5. **Menuin UI/UX Standard Enforcement**:
   Strict avoidance of `uppercase` and `tracking-wider` to maintain natural typography, and strict enforcement of the official `@/components/ui/table` component.

### Architectural Decisions

1. **Granular 4-Pillar Status Decoupling in Hub (`RingkasanClient` & `ProgressCard`)**:
   - The status of each pillar is derived from granular section reviews (`verificationSectionReviews` in `latestSubmission`):
     - **Pillar 1 (Profil Usaha)**: Evaluates `sectionReviews['BUSINESS_PROFILE']?.status`. If approved, remains `Terverifikasi` (green) even if PIC is rejected.
     - **Pillar 2 (Perwakilan Bisnis)**: Evaluates `sectionReviews['REPRESENTATIVE']?.status`. Displays `Perlu Revisi` (amber/rose) only when the representative data or e-KTP is flagged.
     - **Pillar 3 (Rekening Settlement)**: Evaluates `sectionReviews['SETTLEMENT']?.status` and account verification.
     - **Pillar 4 (Lokasi Gerai)**: Evaluates `sectionReviews['OUTLET']?.status` and tenant compliance.
   - `ReviewerNotesCard` strictly displays notes filtered by the exact rejected section.

2. **Unified Document & Image Retrieval Across Subsidebar Pages**:
   - Updated retrieval logic across `business-client.tsx`, `representative-client.tsx`, and `outlet-client.tsx` to read from `latestSubmission` snapshot and `verificationDocuments` table irrespective of scope.
   - Guaranteed persistence of `FOTO_TAMPAK_DEPAN` and `FOTO_KASIR` storage keys into `tenants.storefrontPhotoUrl` and `tenants.indoorPhotoUrl`.
   - Loaded signed URLs for private images to display high-fidelity thumbnails and full-resolution view actions.

3. **Card-Level Verified Checkmark & Alert Icon Header Component**:
   - Enhanced `SectionCard` and form detail card headers with a right-aligned status indicator sejajar dengan judul form:
     - `verified`: Filled green checkmark icon (`CheckCircle2` with emerald styling).
     - `action_required` / `rejected`: Alert icon (`AlertCircle` with amber/rose styling) with hover/click tooltip.
     - `under_review`: Clock icon with blue styling.

4. **Admin Manual Text Field Verification**:
   - Integrated field-level verification in `admin-verification-detail-client.tsx` for critical text data: NIB, NPWP, Legal Name, Entity Type, NIK, PIC Name, Phone, Account Number, Account Holder, Outlet Address.
   - Allows marking fields as `[Sesuai]` or `[Flag / Salah]`, saving flagged field keys into `flaggedFields` on `verificationSectionReviews`.

5. **Elimination of `uppercase` and `tracking-wider`, Enforcement of `@/components/ui/table`**:
   - Replaced all ad-hoc HTML tables with `@/components/ui/table` (`Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`).
   - Replaced all instances of `uppercase tracking-wider` with natural sentence-case font styles (`text-xs font-semibold text-slate-500`).

### Status
**Implemented & Verified.** Standardized across all verification subsidebar clients, `reviewer-notes-card.tsx`, `status-hero-card.tsx`, and admin review console.

---

## Decision 36: Entity-Centric KYC Queue (1 Outlet = 1 Row), Submission Lifecycle Locking, Deterministic Sorting & Inherited Approvals

### Context
Testing with an outlet ("Kopi Mulia") uncovered operational friction in the verification lifecycle:
1. **Queue Clutter & Redundancy**: Submitting revision attempts created multiple separate rows in the admin queue for the same outlet ("Ke-1", "Ke-2"), confusing compliance officers and scattering case context.
2. **Stale/Inaccurate Hub State**: In `getOutletVerificationOverview`, sorting previously relied on `submittedAt DESC`. Because `submittedAt` was either missing or equal to epoch zero (1 Jan 1970) when not explicitly set, sorting was non-deterministic, causing the merchant hub to read the older attempt (Ke-1) where Rekening was rejected rather than the newer attempt (Ke-2) where Rekening was approved.
3. **Data Mutation Race Conditions (Missing Lifecycle Locking)**: Compliance reviewers could modify decisions on superseded historical submissions, and merchants editing revisions could have their forms mutated asynchronously by reviewers.
4. **Repetitive Review Work**: When a merchant fixed only the flagged section (e.g. PIC KTP), the resubmission did not automatically preserve previously approved sections (Profil Usaha, Rekening Bank, Gerai), requiring reviewers to re-verify already valid data.

### Architectural Decisions

1. **Entity-Centric Admin Queue (1 Outlet = 1 Row)**:
   - In `getVerificationQueue`, rows are deduplicated per merchant entity (`tenantId ? 'tenant_' + tenantId : 'bp_' + businessProfileId`).
   - The queue displays exactly one row per outlet/profile showing its latest active attempt number (e.g. `Ke-2` with a `Revisi` badge) and fresh submission timestamp.
   - Queue counters (`submitted`, `action_required`, `verified`, etc.) reflect unique merchant entities rather than raw historical records.

2. **Deterministic Latest Resolution & Explicit Timestamps**:
   - In `getOutletVerificationOverview`, submissions are sorted strictly by `attemptNumber DESC, submittedAt DESC, createdAt DESC`.
   - `submitVerificationApplicationAction` explicitly writes `submittedAt: new Date()` upon creation.
   - Timestamps gracefully fallback to `createdAt` or "Baru saja", permanently eliminating the `1 Jan 1970` Unix epoch glitch.

3. **Lifecycle Locking & Immutability (Read-Only Mode)**:
   - **Superseded Submissions (`isSuperseded = true`)**: If a newer attempt exists for an entity, all prior submissions become immutable read-only audit archives. Reviewers see an informative archive banner with a direct navigation link: `[Buka Pengajuan Terkini (Ke-N)]`.
   - **Waiting for Merchant (`isDecisionIssued = true && status === 'action_required'`)**: Once a decision is issued requesting changes, the form is locked in read-only mode to prevent unilateral edits while the merchant is preparing their revision.
   - **Backend Guard**: `submitVerificationDecisionAction` enforces an immutability guard, rejecting decision submissions on superseded attempts.

4. **Incremental Review & Inherited Section Approval**:
   - In `submitVerificationApplicationAction`, if `attemptNumber > 1`, sections that were previously marked `APPROVED` on the prior submission inherit status `APPROVED` with review note `(Disetujui pada pengajuan sebelumnya)`.
   - Admins can focus exclusively on inspecting newly modified or previously flagged sections.

5. **Menuin UI/UX Standards Compliance**:
   - All badges adhere to Menuin UI SSOT: borderless soft pastel styling (`px-2.5 py-0.5 rounded-md text-[11px] font-medium border-none`), zero uppercase/tracking-wider, zero gradients, and zero colored dots inside badges.

### Status
**Implemented & Verified.** Updated in `merchant-verification.ts`, `admin-verification.ts`, `admin-verification-queue-client.tsx`, and `admin-verification-detail-client.tsx`. Verified with `tsc --noEmit` (0 errors) and Vitest suite (181 passed).

---

## Decision 37: Removal of Redundant Revision Alert Banners from Verification Wizard (Form Canvas & Individual Steps)

### Context
In the multi-step verification onboarding wizard (`wizard-shell.tsx`), an amber alert box (*"Pengajuan Anda Memerlukan Perbaikan"*) was previously rendered at the top of the form canvas whenever one or more sections had status `changes_requested`. Furthermore, individual step forms (Step 1 Profil Usaha, Step 2 Perwakilan Bisnis, Step 3 Rekening Settlement, Step 4 Lokasi Gerai) each rendered duplicate amber alert cards (*"Perlu Perbaikan [Nama Seksi]"*) above their input fields.
However, the left sidebar progress bar (`WizardStepper`) already communicates which steps are completed, approved, or requiring revision (with amber warning icons and step badges), allowing direct step navigation. Having additional alert banners across the canvas and at the top of each step introduced visual clutter, repetitive notices, and unnecessary layout displacement.

### Architectural Decision
1. **Remove Canvas & Step-Level Alert Banners**:
   - Completely eliminate the summary alert banner (`hasAnyChangesRequested ? (...) : ...`) from the form canvas in `wizard-shell.tsx`.
   - Completely remove the step-level alert cards (`isSectionRepaired ? (...) : isNeedsChanges && (...)`) across all 4 step forms:
     - `step-1-business-profile.tsx`
     - `step-2-representative.tsx`
     - `step-3-settlement.tsx`
     - `step-4-outlet.tsx`
   - Clean up unused icon imports (`AlertCircle`, `CheckCircle2`) and unused state variables.
2. **Rely on Sidebar Stepper as SSOT for Step Status**:
   - The left sidebar progress bar (`WizardStepper`) serves as the single source of truth for step-level progression and status feedback.
   - Specific input/document guidance remains in the persistent right-side guideline panel and upload zone status indicators without cluttering the primary form canvas.

### Status
**Implemented & Verified.** Updated in `wizard-shell.tsx`, `step-1-business-profile.tsx`, `step-2-representative.tsx`, `step-3-settlement.tsx`, and `step-4-outlet.tsx`. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser screenshot verification.

---

## Decision 38: Single Alert Policy for Input Fields & Elimination of Inner Box Alert in UploadZone

### Context
On document upload input fields (`UploadZone`), an alert notice indicating that a document was rejected previously appeared in two places simultaneously:
1. Above the card (top right of the field label), as a clean circular alert icon with hover tooltip.
2. Inside the upload card itself (beside the "Ganti" button), as an amber square box button (`w-8 h-8 rounded-[6px] bg-amber-50 border border-amber-200`).
Having duplicate alert indicators within the exact same component was redundant, cluttered the action button row, and created visual fatigue.

### Architectural Decision
1. **Single Alert Principle**:
   - Retain exactly one alert indicator per input field: the top alert icon beside the field label (`group/fieldalert`).
   - Remove the internal square alert box button (`group/cardalert` and `group/emptyalert`) from inside the file card and dropzone in `UploadZone` (`apps/web/src/components/verification/shared/upload-zone.tsx`).
   - Action buttons inside the card remain uncluttered, containing only the essential actions (`[Ganti]` and `[Hapus]`).

### Status
**Implemented & Verified.** Updated in `upload-zone.tsx`. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser visual verification.

---

## Decision 39: Menuin Status Badge Standardization (px-2 py-0.5 rounded-xl, Borderless, Iconless)

### Context
Various status badges and chips across the business verification module had inconsistent styling—some used `rounded-full`, some `rounded-md`, some had explicit 1px borders (`border border-emerald-200`, `border-rose-200`, etc.), and many contained redundant internal icons (`CheckCircle2`, `AlertCircle`, `Clock`, `Star`, `Check`, `FileText`, and emojis like `⏳`, `✓`, `✗`). The user provided an explicit visual reference based on the `Kartu Tanda Penduduk` upload badge, directing that all colored badges in the verification flow must follow a single, standardized aesthetic: `px-2 py-0.5 rounded-xl`, borderless, with zero internal icons to eliminate visual clutter.

### Architectural Decisions

1. **Badge Dimensions & Geometry**:
   - Horizontal and vertical padding: strictly `px-2 py-0.5`.
   - Corner radius: strictly `rounded-xl`.
   - Borders: completely borderless (`border-none` / zero explicit borders).

2. **Zero Internal Icons Policy**:
   - Badges display clean, readable text only.
   - Removed all internal icons (`CheckCircle2`, `AlertCircle`, `Clock`, `Star`, `Check`, `FileText`) and emoji symbols (`⏳`, `✓`, `✗`) from badges and chips.

3. **Universal Application Across Verification Flow**:
   - **`StatusPill` (`components/verification/shared/status-pill.tsx`)**: Updated base classes to `inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium transition-colors border-none`. Instantly standardizes all verification tabs (Business, Representative, Settlement, Outlet, Ringkasan, History).
   - **`UploadZone` (`components/verification/shared/upload-zone.tsx`)**: Standardized `Data Baru Diperbarui` and `Disetujui` badges on file cards and headers.
   - **`SectionCard` (`components/verification/shared/section-card.tsx`)**: Standardized `Terverifikasi`, `Perlu Revisi`, and `Sedang Ditinjau` badges.
   - **`WizardStepper` (`components/verification/wizard/wizard-stepper.tsx`)**: Standardized `Disetujui` step badge.
   - **`Step1BusinessProfile` (`components/verification/wizard/steps/step-1-business-profile.tsx`)**: Standardized `entityType` and `Terverifikasi` badges.
   - **`Step3Settlement` (`components/verification/wizard/steps/step-3-settlement.tsx`)**: Standardized `Terverifikasi`, `Ditolak`, and `matchScore` badges.
   - **`ProgressCard` (`components/verification/hub/progress-card.tsx`)**: Standardized `{completedCount} dari 4` progress badge.
   - **`SettlementClient` (`app/outlet/[outletKey]/verification/settlement/settlement-client.tsx`)**: Standardized `Utama` and `Outlet Ini` badges without icons.
   - **`HistoryClient` (`app/outlet/[outletKey]/verification/history/history-client.tsx`)**: Standardized `submissionScope` badge without icon.
   - **`GuidelinePanel` (`components/verification/wizard/guideline-panel.tsx`)**: Standardized document status badges.
   - **Admin Console (`admin-verification-queue-client.tsx` & `admin-verification-detail-client.tsx`)**: Standardized all queue/detail status badges, section chips (removed emojis), and notice badges.

### Status
**Implemented & Verified.** Standardized across all 12 component and client files. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser visual inspection.

---

## Decision 40: Elimination of Legacy `hover:underline` on Action Buttons & Adoption of Modern Micro-Interactive Buttons

### Context
User feedback highlighted that the "Perbaiki Rekening" button (and similar inline action buttons across the verification module) had outdated hover and click animations—specifically using `hover:underline` (which feels like a 1990s hyperlink) and lacking satisfying physical press feedback. The user requested creating a more modern, polished button animation matching Menuin's design language.

### Architectural Decisions

1. **Elimination of `hover:underline` on Buttons**:
   - Banned `hover:underline` on action buttons and pills.
   - Replaced with solid background tint shifts, smooth color inversion, and subtle elevation shadows.

2. **Modern Menuin Interactive Action Button Specifications**:
   - **Base Structure**: `group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50 border border-blue-200/60 shadow-2xs select-none`.
   - **Hover Animation**: Smooth color inversion (`hover:bg-[#0e59f9] hover:text-white hover:border-[#0e59f9] hover:shadow-xs`) with `transition-all duration-200 ease-out`.
   - **Click / Press Animation**: Tactile physical feedback with `active:scale-95 duration-100`.
   - **Icon Micro-Interaction**:
     - `RefreshCw` on "Perbaiki Rekening": `transition-transform duration-500 ease-out group-hover:rotate-180`.
     - `Edit3` on "Ubah Data" / "Ubah": `transition-transform duration-200 ease-out group-hover:scale-110`.
     - `ArrowRight` on "Perbaiki Data": `transition-transform duration-200 ease-out group-hover:translate-x-0.5`.
     - `LocateFixed` on "Gunakan Lokasi Saat Ini": `transition-transform duration-300 ease-out group-hover:scale-110`.

3. **Affected Components**:
   - `step-3-settlement.tsx`: "Perbaiki Rekening" button.
   - `step-1-business-profile.tsx`: "Ubah Data" toggle button.
   - `step-4-outlet.tsx`: "Gunakan Lokasi Saat Ini" button.
   - `step-5-review.tsx`: All 4 "Ubah" step jump buttons.
   - `reviewer-notes-card.tsx`: "Perbaiki Data" action button.
   - `upload-zone.tsx`: Replaced `hover:underline` on filename with `hover:text-[#0e59f9]`.

### Status
**Implemented & Verified.** Updated in `step-3-settlement.tsx`, `step-1-business-profile.tsx`, `step-4-outlet.tsx`, `step-5-review.tsx`, `reviewer-notes-card.tsx`, and `upload-zone.tsx`. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser screenshot verification.

---

## Decision 41: Elimination of Verification Overview Alert Components & Addition of Circular Edit Button on Action-Required Pillar Cards

### Context
User feedback requested removing all alert notice components from the business verification hub overview page (`/outlet/[outletKey]/verification`), where a large red alert card (`ReviewerNotesCard`) was displayed above the main content cards. Instead of heavy alert banners, the user directed that cards needing revision (`action_required`) should feature a round edit icon button ("tombol bulat icon edit") that, when clicked, navigates directly to the corresponding onboarding step form.

### Architectural Decisions

1. **Elimination of Alert Components on Verification Overview**:
   - Removed `<ReviewerNotesCard />` from `apps/web/src/app/outlet/[outletKey]/verification/ringkasan-client.tsx`.
   - The hero 12-column grid (`StatusHeroCard` and `ProgressCard`) now sits directly below the clean `PageHeader`, providing a distraction-free, spacious interface.

2. **Circular Edit Button on `action_required` Pillar Cards**:
   - In `apps/web/src/components/verification/hub/pillar-card.tsx`:
     - Replaced the static `<CircleAlert className="text-rose-500" />` icon on `action_required` cards with an interactive circular edit button.
     - Button specifications:
       `group/editbtn w-7 h-7 rounded-full bg-blue-50 hover:bg-[#0e59f9] text-[#0e59f9] hover:text-white border border-blue-200/70 hover:border-[#0e59f9] flex items-center justify-center transition-all duration-200 ease-out active:scale-90 shadow-2xs hover:shadow-xs cursor-pointer select-none`
     - Micro-animation: `<Edit3 className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/editbtn:scale-110" />`.
     - Click behavior: `e.stopPropagation()` and `router.push(editHref)`, navigating directly to the onboarding step:
       - Profil Usaha: `/outlet/[outletKey]/verification/onboarding?step=1`
       - Perwakilan Bisnis: `/outlet/[outletKey]/verification/onboarding?step=2`
       - Rekening Settlement: `/outlet/[outletKey]/verification/onboarding?step=3`
       - Kepatuhan Lokasi Gerai: `/outlet/[outletKey]/verification/onboarding?step=4`

3. **ProgressCard Integration**:
   - In `apps/web/src/components/verification/hub/progress-card.tsx`, wired `editHref` to all 4 `PillarCard` instances.

### Status
**Implemented & Verified.** Updated in `ringkasan-client.tsx`, `pillar-card.tsx`, and `progress-card.tsx`. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser screenshot verification (`click_feedback_1792331713340.png`).

---

## Decision 42: Refinement of PillarCard Dual-Indicator Layout (Top-Right Alert, Bottom-Right Borderless Edit) & Elimination of Non-Essential "Tutup Formulir" Toggle

### Context
1. In the verification hub (`/outlet/[outletKey]/verification`), user requested keeping the red `CircleAlert` icon at the top right of the `action_required` card as an immediate status indicator, while positioning the circular edit button at the bottom right with a borderless design (`border-none`) and retaining the smooth scale/hover animation.
2. In the verification onboarding wizard (`Step 1: Profil Usaha`), a toggle button labeled "Tutup Formulir" / "Ubah Data" was previously placed next to the "Data Legalitas Usaha" section header. The user inquired about its purpose and directed that it be removed if not essential.

### Architectural Decisions

1. **PillarCard Dual-Indicator Layout**:
   - **Top Right Indicator**: Restored `<CircleAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />` for cards in `action_required` status.
   - **Bottom Right Edit Button**: Positioned at the bottom-right corner alongside the status label:
     - Specifications: `group/editbtn w-7 h-7 rounded-full bg-blue-50 hover:bg-[#0e59f9] text-[#0e59f9] hover:text-white flex items-center justify-center transition-all duration-200 ease-out active:scale-90 shadow-2xs hover:shadow-xs cursor-pointer select-none flex-shrink-0` (no borders).
     - Micro-animation: `<Edit3 className="w-3.5 h-3.5 transition-transform duration-200 ease-out group-hover/editbtn:scale-110" />`.
     - Direct jump: `router.push(editHref || href)`.

2. **Elimination of Non-Essential "Tutup Formulir" Toggle**:
   - The toggle button originally existed to collapse the legal data form when a merchant selected an existing profile from another outlet. However, during onboarding or revision, collapsing the form caused confusion as users could not inspect or correct their fields without an extra click.
   - Removed the toggle button from `step-1-business-profile.tsx`.
   - Set `showForm = true` so the legal data fields under "Data Legalitas Usaha" remain persistently visible, accessible, and clean.

### Status
**Implemented & Verified.** Updated in `pillar-card.tsx` and `step-1-business-profile.tsx`. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), and browser screenshot verification (`verification_hub_pillar_cards_1792332197717.png` and `onboarding_step_1_clean_1792332210054.png`).

---

## Decision 43: Complete Elimination of `uppercase` & `tracking-wider` Typography in Verification Domain

### Context
User gave strict feedback: "kan saya sudah bilang kalau penulisan typography jangan menggunakan uppercase dan tracking wider catat itu". The header eyebrow in `PageHeader` (`page-header.tsx`) was previously using `uppercase tracking-widest` (`text-[11px] font-medium text-slate-400 uppercase tracking-widest`), causing `VERIFIKASI BISNIS • KOPI MULIA TEST` to render in loud all-caps with unnatural letter spacing. Additionally, remnants of `uppercase` existed in Step 5 review field labels, history client thead, guideline panel, settlement input class, and status hero card.

### Architectural Decisions

1. **Strict Prohibition of `uppercase` & `tracking-wider` / `tracking-widest`**:
   - `uppercase`, `tracking-wider`, and `tracking-widest` are completely banned in the verification suite typography.
   - All text, headers, eyebrows, table headers, and field labels must follow natural sentence-case capitalization and default font tracking.

2. **Affected Files & Modifications**:
   - **`page-header.tsx`**: Changed eyebrow from `text-[11px] font-medium text-slate-400 uppercase tracking-widest` to `text-xs font-semibold text-slate-500` (renders natural sentence-case `Verifikasi Bisnis • Kopi Mulia Test`).
   - **`history-client.tsx`**: Table header row updated from `text-[11px] font-semibold text-slate-400 uppercase tracking-wider` to `text-xs font-semibold text-slate-500`.
   - **`step-5-review.tsx`**: All 18 field labels (Nama Usaha, Bentuk Entitas, NIB, NPWP, Nama Penanggung Jawab, Jabatan, NIK, Kewarganegaraan, Nomor Telepon, Email, Bank, Nomor Rekening, Nama Pemilik Rekening, Alamat Gerai, Provinsi, Kota/Kabupaten, Kecamatan, Kode Pos) updated from `uppercase text-[10px]` to `text-slate-500 text-[11px] font-medium`.
   - **`guideline-panel.tsx`**: "Panduan Pengisian" eyebrow updated to natural typography; watermark removed `tracking-widest`.
   - **`step-3-settlement.tsx`**: Removed `uppercase` from `bankAccountHolder` input className.
   - **`status-hero-card.tsx`**: Removed `tracking-wide` from status label.
   - **`upload-zone.tsx`**: Removed `uppercase` from `PDF` file type badge.

### Status
**Implemented & Verified.** Cleaned across all 7 affected components. Verified with `tsc --noEmit` (0 errors), Vitest suite (181 passed), grep verification (0 matches for uppercase / tracking-wid*), and live browser inspection (`verification_hub_page_1792332837326.png`).


















