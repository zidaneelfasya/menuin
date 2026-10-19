# MENUIN Business Verification & Admin Verification — Task Register

**Feature:** Integrated Business Verification, Admin Verification, and Payment Readiness  
**Task ID Prefix:** `BV-001` through `BV-043`  
**Current Status:** All 43 tasks `completed` (100% Implemented, Integrated & Validated)  
**Last Updated:** 2026-10-18  

---

## Task Summary Matrix

| Task ID | Phase | Title | Complexity | Priority | Dependencies | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **BV-001** | Phase 1 | Verification Domain Models, Types & State Machine | M | P0 (Critical) | None | ✅ `completed` |
| **BV-002** | Phase 1 | RBAC & Permission Model for Verification Admin | M | P0 (Critical) | `BV-001` | ✅ `completed` |
| **BV-003** | Phase 2 | Database Schema Definition in Drizzle ORM | L | P0 (Critical) | `BV-001`, `BV-002` | ✅ `completed` |
| **BV-004** | Phase 2 | Database Migration & Idempotent Seed Scripts | M | P0 (Critical) | `BV-003` | ✅ `completed` |
| **BV-005** | Phase 3 | Private Document Storage Infrastructure & Upload Action | M | P0 (Critical) | `BV-003` | ✅ `completed` |
| **BV-006** | Phase 3 | Time-Limited Signed URL Document Access Controller | M | P0 (Critical) | `BV-005` | ✅ `completed` |
| **BV-007** | Phase 4 | Merchant Business Verification Server Actions | L | P1 (High) | `BV-003`, `BV-005` | ✅ `completed` |
| **BV-008** | Phase 4 | Merchant Business Verification Flow UI | L | P1 (High) | `BV-007`, `BV-005` | ✅ `completed` |
| **BV-009** | Phase 4 | Merchant Resubmission & Correction Workflow | M | P1 (High) | `BV-007`, `BV-008` | ✅ `completed` |
| **BV-010** | Phase 5 | Admin Panel Shell & Navigation Restoration | M | P1 (High) | `BV-002` | ✅ `completed` |
| **BV-011** | Phase 5 | Admin Verification Queue Server Actions | M | P1 (High) | `BV-003`, `BV-010` | ✅ `completed` |
| **BV-012** | Phase 5 | Admin Verification Overview & Review Queue UI | L | P1 (High) | `BV-011`, `BV-010` | ✅ `completed` |
| **BV-013** | Phase 5 | Admin Verification Detail & Decision Console | XL | P1 (High) | `BV-011`, `BV-006` | ✅ `completed` |
| **BV-014** | Phase 6 | DOKU Onboarding Domain Adapter & Provider Contract | M | P1 (High) | `BV-001` | ✅ `completed` |
| **BV-015** | Phase 6 | DOKU Sub-Account Onboarding Sync & Manual Fallback | L | P1 (High) | `BV-014`, `BV-003` | ✅ `completed` |
| **BV-016** | Phase 7 | Server-Side Payment Readiness Assertion Gate | M | P0 (Critical) | `BV-003`, `BV-014` | ✅ `completed` |
| **BV-017** | Phase 7 | Checkout & POS Payment Execution Guard | M | P0 (Critical) | `BV-016` | ✅ `completed` |
| **BV-018** | Phase 8 | MENUIN Care Contextual Verification Bridge | S | P2 (Medium) | `BV-001`, `BV-002` | ✅ `completed` |
| **BV-019** | Phase 9 | Security & Authorization Automated Test Suite | L | P0 (Critical) | `BV-002`, `BV-006`, `BV-016` | ✅ `completed` |
| **BV-020** | Phase 9 | State Machine & Workflow Integration Tests | L | P1 (High) | `BV-007`, `BV-011`, `BV-016` | ✅ `completed` |
| **BV-021** | Phase 9 | End-to-End Regression & Accessibility (a11y) Verification | M | P1 (High) | `BV-008`, `BV-012`, `BV-013` | ✅ `completed` |
| **BV-022** | Phase 10 | Verification Operational Runbook & Reviewer SOP | S | P2 (Medium) | All previous | ✅ `completed` |
| **BV-023** | Phase 4 | Enterprise Form Radius & Skill Protocol Standardization | S | P1 (High) | `BV-022` | ✅ `completed` |
| **BV-024** | Phase 4 | Direct-Click Full-Surface Upload Dropzone | XS | P1 (High) | `BV-023` | ✅ `completed` |
| **BV-025** | Phase 4 | Searchable Enterprise Legal Entity Combobox | S | P1 (High) | `BV-024` | ✅ `completed` |
| **BV-026** | Phase 4 | Toast-Guarded Unrestricted Step Browsing | XS | P1 (High) | `BV-025` | ✅ `completed` |
| **BV-027** | Phase 4 | Business Representative (PIC) Step 2 Layout Alignment | S | P1 (High) | `BV-026` | ✅ `completed` |
| **BV-028** | Phase 2/4 | Multi-Tenant Profile & Settlement Data Isolation | M | P0 (Critical) | `BV-002`, `BV-007` | ✅ `completed` |
| **BV-029** | Phase 4 | Zero Default Values & Unrestricted Stepper Browsing | S | P1 (High) | `BV-026`, `BV-028` | ✅ `completed` |
| **BV-030** | Phase 4 | UI/UX Dropdown Architecture Standardization (Combobox SOT) | S | P1 (High) | `BV-025`, `BV-027` | ✅ `completed` |
| **BV-031** | Phase 4 | Global Interactive Lock & Upload Loading Guard | S | P1 (High) | `BV-024`, `BV-030` | ✅ `completed` |
| **BV-032** | Phase 4 | Verification Flow V2 — Single ACID Submission & Honest Stepper Status | XL | P0 (Critical) | `BV-007`, `BV-008`, `BV-009`, `BV-031` | ✅ `completed` |
| **BV-033** | Phase 5 | Granular Admin Review Console & Lifecycle Reopen | L | P1 (High) | `BV-012`, `BV-013`, `BV-032` | ✅ `completed` |
| **BV-034** | Phase 4 | Clean Stepper, Inline Alert Tooltips & Responsive Update Feedback | S | P1 (High) | `BV-032` | ✅ `completed` |
| **BV-035** | Phase 4 | Granular 4-Pillar Decoupling & Independent Rejection Status in Hub | M | P0 (Critical) | `BV-032`, `BV-033` | ✅ `completed` |
| **BV-036** | Phase 4 | Subsidebar Detail Pages Image Storage Sync & Signed URL Display | M | P1 (High) | `BV-005`, `BV-032` | ✅ `completed` |
| **BV-037** | Phase 4 | Card-Level Verified Fill Checkmark & Alert Icon Indicators | S | P1 (High) | `BV-035` | ✅ `completed` |
| **BV-038** | Phase 5 | Admin Manual Verification of Critical Form Text Fields | M | P1 (High) | `BV-033` | ✅ `completed` |
| **BV-039** | Phase 4 | Menuin UI/UX Standards: Typography (No Uppercase) & Standard Table | S | P1 (High) | `BV-023` | ✅ `completed` |
| **BV-040** | Phase 4 | Deterministic Latest Resolution & Explicit Submission Timestamps | S | P0 (Critical) | `BV-032` | ✅ `completed` |
| **BV-041** | Phase 5 | Entity-Centric KYC Queue (1 Outlet = 1 Row) & Attempt Counters | M | P1 (High) | `BV-012`, `BV-040` | ✅ `completed` |
| **BV-042** | Phase 5 | Verification Lifecycle Locking, Immutability & Archive Navigation | M | P0 (Critical) | `BV-013`, `BV-041` | ✅ `completed` |
| **BV-043** | Phase 4/5 | Incremental Review & Inherited Section Approvals on Resubmissions | M | P1 (High) | `BV-032`, `BV-042` | ✅ `completed` |

---


## Detailed Task Register

### Phase 1: Architecture & Shared Foundations

#### BV-001
- **Task ID:** `BV-001`
- **Title:** Verification Domain Models, Decoupled 4-State Machine & Two-Tier Types
- **Objective:** Establish the canonical domain types, status enums, transition maps, validation rules, and error codes for the 1:N:M hierarchy and two-tier verification system.
- **Context and rationale:** Internal business verification, outlet compliance, DOKU provider onboarding status, and payment readiness must be strictly decoupled state models. Defining this first prevents divergent state assumptions between merchant forms and admin consoles.
- **Expected changes:**
  - Create `@menuin/types/src/verification.ts` defining:
    - `BusinessProfileVerificationStatus`: `not_started` | `draft` | `submitted` | `under_review` | `action_required` | `verified` | `rejected` | `suspended`
    - `OutletComplianceStatus`: `incomplete` | `ready_for_review` | `verified` | `action_required`
    - `ProviderOnboardingStatus`: `NOT_PROVISIONED` | `PROVISIONING` | `ACTIVE` | `PENDING_REVIEW` | `SUSPENDED` | `FAILED`
    - `PaymentReadinessStatus`: `READY` | `BLOCKED`
    - `DocumentType`: Tier 1 (KTP, NPWP, NIB, AKTA, BUKU_TABUNGAN) vs. Tier 2 (FOTO_TAMPAK_DEPAN, FOTO_KASIR, IZIN_LOKASI)
    - `DocumentScope`: `BUSINESS_PROFILE` | `OUTLET`
  - Implement pure state transition validators:
    - `isValidBusinessStatusTransition(current, next, actorRole)`
    - `isValidOutletStatusTransition(current, next, actorRole)`
  - Define custom domain error codes (`BUSINESS_NOT_VERIFIED`, `OUTLET_NOT_VERIFIED`, `SUB_ACCOUNT_INACTIVE`, `UNAUTHORIZED_REVIEWER`).
- **Affected modules/files:**
  - `packages/types/src/verification.ts`
  - `packages/types/src/index.ts`
  - `packages/validation/src/verification.schema.ts`
- **Dependencies:** None
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - All 4 independent status types and two-tier document scopes are strictly typed with Zod schemas.
  - State machine function rejects unauthorized or illegal status jumps.
  - Unit tests verify valid and invalid transitions with 100% branch coverage.
- **Verification method:** Execute TypeScript compile check (`tsc --noEmit`) and Jest/Vitest unit test runner.
- **Responsible role:** Technical Lead / Architecture Analyst
- **Status:** ✅ `completed`

---

#### BV-002
- **Task ID:** `BV-002`
- **Title:** RBAC & Permission Model for Verification Admin
- **Objective:** Extend MENUIN's permission system to include explicit verification administration permissions, separating Verification Admins, Super Admins, Care Agents, and Merchants.
- **Context and rationale:** Currently, admin checks rely on unstructured string comparisons (`user.role === 'SYSTEM_ADMIN' || user.role === 'OWNER'`). Care agents must not be able to approve verification or view unmasked PII.
- **Expected changes:**
  - Update `packages/permissions/src/role.ts` to include `VERIFICATION_ADMIN`.
  - Define granular permission flags:
    - `verification:view_queue`
    - `verification:view_detail`
    - `verification:review` (approve, reject, request changes)
    - `verification:escalate`
    - `verification:view_sensitive_pii`
    - `care:view_summary` (read-only high-level status for customer support)
  - Implement server-side assertion helper `assertPermission(user, permission)`.
- **Affected modules/files:**
  - `packages/permissions/src/role.ts`
  - `packages/permissions/src/permissions.ts`
  - `packages/permissions/src/index.ts`
  - `apps/web/src/lib/actions/auth-context.ts`
- **Dependencies:** `BV-001`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - Calling a review action with a user lacking `verification:review` immediately throws `ForbiddenError` (HTTP 403).
  - Users with `care:view_summary` can view high-level status but cannot call review actions.
  - Merchant `OWNER` can only access their own business verification records.
- **Verification method:** Unit test verifying permission assertion against role matrices.
- **Responsible role:** Security Reviewer / Technical Lead
- **Status:** ✅ `completed`

---

### Phase 2: Data Model and Migrations

#### BV-003
- **Task ID:** `BV-003`
- **Title:** Database Schema Definition for 1:N:M Hierarchy & Two-Tier Verification
- **Objective:** Define clean, normalized, and indexed database tables in Drizzle ORM supporting 1 Account -> N Business Profiles -> M Outlets (`tenants`), with strict separation of Tier 1 legal documents and Tier 2 outlet location evidence.
- **Context and rationale:** F&B merchants may operate multiple legal entities under one account and multiple outlets per entity. Legal entity documents (KTP/NPWP/NIB/Rekening) are verified once per `business_profiles` and reused across outlets. Outlet physical location details and storefront photos are verified per `tenants`.
- **Expected changes:**
  - Add/update tables in `apps/web/src/lib/db/schema.ts`:
    1. `business_profiles`:
       - `id`: UUID PK
       - `accountId`: UUID FK to `accounts.id` (1 Account -> N Business Profiles)
       - `name`: TEXT NOT NULL (Nama Badan Usaha / Brand)
       - `entityType`: TEXT NOT NULL ('INDIVIDUAL' | 'PT' | 'CV' | 'YAYASAN' | 'KOPERASI')
       - `taxId`: TEXT (NPWP masked)
       - `businessLicenseNumber`: TEXT (NIB)
       - `responsiblePersonName`: TEXT NOT NULL
       - `responsiblePersonNik`: TEXT NOT NULL (masked)
       - `responsiblePersonContact`: TEXT NOT NULL
       - `bankName`: TEXT NOT NULL
       - `bankAccountNumber`: TEXT NOT NULL (masked / encrypted)
       - `bankAccountHolder`: TEXT NOT NULL
       - `verificationStatus`: TEXT NOT NULL DEFAULT 'not_started'
       - `createdAt`, `updatedAt`: TIMESTAMPTZ
    2. `tenants` (Update existing table - Non-destructive):
       - `businessProfileId`: UUID FK to `business_profiles.id` (NULLABLE)
       - `address`: TEXT (Alamat spesifik cabang)
       - `city`: TEXT
       - `postalCode`: TEXT
       - `latitude`: NUMERIC(10, 8)
       - `longitude`: NUMERIC(11, 8)
       - `storefrontPhotoUrl`: TEXT
       - `outletComplianceStatus`: TEXT NOT NULL DEFAULT 'incomplete'
    3. `verification_submissions`:
       - `id`: UUID PK
       - `businessProfileId`: UUID FK to `business_profiles.id`
       - `tenantId`: UUID FK to `tenants.id` (NULLABLE, present for outlet-level reviews)
       - `submissionScope`: TEXT NOT NULL ('BUSINESS_PROFILE' | 'OUTLET')
       - `attemptNumber`: INTEGER NOT NULL DEFAULT 1
       - `status`: TEXT NOT NULL
       - `submissionSnapshot`: JSONB NOT NULL
       - `submittedAt`, `reviewedAt`: TIMESTAMPTZ
       - `reviewedBy`: UUID FK to `accounts.id`
       - `decisionReason`, `internalNotes`: TEXT
       - `createdAt`, `updatedAt`: TIMESTAMPTZ
    4. `verification_documents`:
       - `id`: UUID PK
       - `submissionId`: UUID FK to `verification_submissions.id`
       - `tenantId`: UUID FK to `tenants.id` (NULLABLE)
       - `documentScope`: TEXT NOT NULL ('BUSINESS_PROFILE' | 'OUTLET')
       - `documentType`: TEXT NOT NULL
       - `storageKey`: TEXT NOT NULL
       - `fileName`: TEXT NOT NULL
       - `fileSizeBytes`: INTEGER NOT NULL
       - `mimeType`: TEXT NOT NULL
       - `reviewStatus`: TEXT NOT NULL DEFAULT 'PENDING'
       - `reviewNote`: TEXT
       - `uploadedAt`, `reviewedAt`: TIMESTAMPTZ
    5. `provider_onboardings`:
       - `id`: UUID PK
       - `businessProfileId`: UUID FK to `business_profiles.id`
       - `tenantId`: UUID FK to `tenants.id`
       - `provider`: TEXT NOT NULL DEFAULT 'DOKU'
       - `providerReference`: TEXT (DOKU Sub-Account profileId)
       - `providerStatus`: TEXT NOT NULL DEFAULT 'NOT_PROVISIONED'
       - `idempotencyKey`: TEXT
       - `lastSyncedAt`: TIMESTAMPTZ
       - `lastErrorCode`, `lastErrorMessage`: TEXT
       - `createdAt`, `updatedAt`: TIMESTAMPTZ
    6. `verification_audit_logs`:
       - `id`: UUID PK
       - `businessProfileId`: UUID FK
       - `tenantId`: UUID FK (NULLABLE)
       - `actorId`: UUID FK to `accounts.id`
       - `actorRole`: TEXT NOT NULL
       - `action`: TEXT NOT NULL
       - `previousStatus`, `newStatus`: TEXT
       - `reason`: TEXT
       - `ipAddress`: TEXT
       - `metadata`: JSONB
       - `createdAt`: TIMESTAMPTZ
- **Affected modules/files:**
  - `apps/web/src/lib/db/schema.ts`
- **Dependencies:** `BV-001`, `BV-002`
- **Priority:** P0 (Critical)
- **Complexity:** L
- **Acceptance criteria:**
  - Drizzle schema compiles cleanly with strict relational types.
  - `business_profiles` and `tenants` support 1:N and 1:M relationships without circular locks.
  - Existing `tenants` columns are preserved with zero data corruption.
  - Explicit composite indexes added: `(businessProfileId, status)`, `(tenantId, outletComplianceStatus)`.
- **Verification method:** Run dry-run compilation and inspect generated TypeScript types.
- **Responsible role:** Architecture and Database Reviewer
- **Status:** ✅ `completed`

---

#### BV-004
- **Task ID:** `BV-004`
- **Title:** Database Migration & Idempotent Seed Scripts
- **Objective:** Generate and validate safe, non-destructive SQL migrations and test seed data for the verification domain.
- **Context and rationale:** Zero downtime and zero data loss on existing `tenants`, `accounts`, and `transactions` tables are required.
- **Expected changes:**
  - Generate Drizzle migration file in `apps/web/drizzle/`.
  - Verify migration SQL does not alter or lock existing production tables destructively.
  - Create idempotent seed script in `apps/web/src/lib/db/seed-verification.ts` with representative test scenarios:
    - Business A: `not_started`
    - Business B: `submitted` (awaiting admin review)
    - Business C: `action_required` (KTP photo blurry)
    - Business D: `verified` + DOKU `active` (payment ready)
    - Business E: Multi-outlet business (1 business profile linked to 2 tenants).
- **Affected modules/files:**
  - `apps/web/drizzle/*_verification_tables.sql`
  - `apps/web/src/lib/db/seed-verification.ts`
- **Dependencies:** `BV-003`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - Migration script applies cleanly on local database and can be rolled back safely.
  - Seed script runs idempotently without duplicate key collisions.
- **Verification method:** Execute local migration dry-run and inspect schema diff against live local postgres.
- **Responsible role:** Architecture and Database Reviewer
- **Status:** ✅ `completed`

---

### Phase 3: Secure Document Storage Infrastructure

#### BV-005
- **Task ID:** `BV-005`
- **Title:** Private Document Storage Infrastructure & Upload Action
- **Objective:** Implement a dedicated private Supabase Storage bucket and secure server-side upload action with file type, size, and magic-byte validation.
- **Context and rationale:** Current `uploadImageToSupabase` creates public buckets. Verification documents contain sensitive PII (KTP, tax records, bank statements) that must never be publicly readable on the open internet.
- **Expected changes:**
  - Implement `uploadVerificationDocument` server action in `apps/web/src/lib/actions/verification-storage.ts`.
  - Enforce private bucket `verification-documents` (`public: false`).
  - Validate file criteria:
    - Max size: 5 MB.
    - MIME check: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
    - Magic-byte validation using file buffer header.
  - Store files under tenant-isolated path: `business_${businessProfileId}/sub_${submissionId}/${docType}_${uuid}.${ext}`.
- **Affected modules/files:**
  - `apps/web/src/lib/actions/verification-storage.ts`
- **Dependencies:** `BV-003`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - Uploaded files are private (direct HTTP GET returns 403 Forbidden).
  - Executable files or files with spoofed extensions (.exe renamed to .png) are rejected.
  - Storage key is returned to server action, never a raw public URL.
- **Verification method:** Automated upload test verifying rejected invalid file types and confirmed private bucket ACL.
- **Responsible role:** Security Reviewer / Backend Engineer
- **Status:** ✅ `completed`

---

#### BV-006
- **Task ID:** `BV-006`
- **Title:** Time-Limited Signed URL Document Access Controller
- **Objective:** Provide secure, short-lived signed URLs for viewing verification documents, strictly authorized by user identity.
- **Context and rationale:** Verification reviewers and merchants need to inspect documents. Signed URLs with a 60-second TTL ensure documents cannot be leaked or hotlinked.
- **Expected changes:**
  - Implement `getVerificationDocumentUrl(documentId: string)` server action.
  - Check caller authorization:
    - If reviewer: must have `verification:view_detail` permission.
    - If merchant: must be `OWNER` of the owning `business_profile`.
  - Generate Supabase signed URL with `expiresIn: 60` (60 seconds).
  - Log document access event in `audit_logs`.
- **Affected modules/files:**
  - `apps/web/src/lib/actions/verification-storage.ts`
- **Dependencies:** `BV-005`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - Unauthorized user calling `getVerificationDocumentUrl` receives 403 Forbidden.
  - Generated URL expires after 60 seconds.
  - Every document access is recorded with `actor_id` and timestamp.
- **Verification method:** Automated test attempting unauthorized access and verifying TTL expiration.
- **Responsible role:** Security Reviewer / Backend Engineer
- **Status:** ✅ `completed`

---

### Phase 4: Merchant Business Verification Experience

#### BV-007
- **Task ID:** `BV-007`
- **Title:** Merchant Business Verification & Outlet Linkage Server Actions
- **Objective:** Implement secure server actions for merchants to manage multiple business profiles, link outlets, submit Tier 1 legal identity documents, and submit Tier 2 physical outlet evidence.
- **Context and rationale:** In accordance with the 1:N:M model, an account may manage multiple business profiles. Outlets can reuse verified business profiles or submit new ones. Per `vercel-react-best-practices`, server actions must authenticate caller identity, enforce ownership, and validate payloads with Zod.
- **Expected changes:**
  - Create `apps/web/src/lib/actions/merchant-verification.ts`:
    - `listAccountBusinessProfiles()`: Returns all business profiles owned by the authenticated account.
    - `linkOutletToBusinessProfile(tenantId, businessProfileId)`: Binds an outlet to an existing business profile.
    - `saveBusinessProfileDraft(formData)`: Saves legal entity data without submitting for review.
    - `submitBusinessProfileVerification(formData)`: Submits Tier 1 legal entity data & documents (KTP, NPWP, NIB, Rekening Bank).
    - `submitOutletCompliance(tenantId, formData)`: Submits Tier 2 outlet location details, GPS coordinates, and storefront photos.
    - `getOutletVerificationOverview(tenantId)`: Computes the 4 decoupled states (Business Profile, Outlet Compliance, DOKU Sub-Account, Payment Readiness).
- **Affected modules/files:**
  - `apps/web/src/lib/actions/merchant-verification.ts`
  - `packages/validation/src/verification.schema.ts`
- **Dependencies:** `BV-003`, `BV-005`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - An owner can link an outlet to an already verified business profile without re-submitting legal documents.
  - Submitting Tier 2 outlet data transitions `outletComplianceStatus` to `ready_for_review`.
  - Non-owner calling actions receives 403 Forbidden.
- **Verification method:** Integration test simulating multi-profile creation, outlet linkage, and two-tier submission.
- **Responsible role:** Full-Stack Engineer / Planning Owner
- **Status:** ✅ `completed`

---

#### BV-008
- **Task ID:** `BV-008`
- **Title:** Two-Tier Merchant Verification Wizard UI
- **Objective:** Build the merchant-facing verification wizard at `/outlet/[outletKey]/verification` supporting multi-business profiles, document inheritance, and outlet physical evidence.
- **Context and rationale:** Merchant should easily select whether this outlet belongs to an existing verified business or a new legal entity, review prefilled information, upload required documents, and track all 4 compliance states.
- **Expected changes:**
  - Build route `apps/web/src/app/outlet/[outletKey]/verification/page.tsx` and client component `verification-flow-client.tsx`.
  - Stepper structure:
    1. *Pilih / Buat Profil Bisnis* (Pilih profil bisnis yang sudah terdaftar atau buat profil badan usaha baru).
    2. *Legalitas & Identitas Usaha (Tier 1)* (Nama Usaha, NIK/KTP Penanggung Jawab, NPWP, NIB, Rekening Bank — otomatis terverifikasi jika profil bisnis sudah disetujui sebelumnya).
    3. *Lokasi & Bukti Fisik Outlet (Tier 2)* (Alamat lengkap fisik cabang, Kota, Kode Pos, Pinpoint Maps/GPS, Foto Tampak Depan dengan plang nama, Foto Area Kasir).
    4. *Ringkasan Kepatuhan & Kesiapan Pembayaran* (Dashboard 4 status: Profil Bisnis, Kelengkapan Outlet, Status DOKU, Kesiapan Pembayaran).
  - Status banner at top showing current state with plain, non-robotic Indonesian copy (per `humanizer`).
  - Document dropzone with upload progress, file preview, and 8-state button states (per `hallmark`).
- **Affected modules/files:**
  - `apps/web/src/app/outlet/[outletKey]/verification/page.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/verification-flow-client.tsx`
  - `apps/web/src/components/verification/document-uploader.tsx`
  - `apps/web/src/components/layout/sidebar.tsx` (add verification badge/link)
- **Dependencies:** `BV-007`, `BV-005`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - UI strictly adheres to MENUIN SSOT: solid `#0e59f9` hero anchor, zero gradients, max font weight `font-semibold`, borderless status badges.
  - Mobile responsive: collapses cleanly on viewport widths 320px–768px without horizontal scroll.
  - An outlet linked to an existing verified business profile immediately reflects Tier 1 as verified and prompts only for Tier 2 outlet location details.
- **Verification method:** Browser testing on mobile and desktop viewports, accessibility audit.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-009
- **Task ID:** `BV-009`
- **Title:** Merchant Resubmission & Correction Workflow
- **Objective:** Handle the `action_required` state, highlighting specific fields or documents that need revision and allowing the merchant to resubmit without starting from scratch.
- **Context and rationale:** If an admin notes "Foto KTP buram", the merchant must clearly see which document was rejected and the exact note, while previously accepted documents remain intact.
- **Expected changes:**
  - In `verification-flow-client.tsx`, when `status === 'action_required'`, highlight items marked `REJECTED` with an amber notice and reviewer's note.
  - Allow replacing only the rejected documents or updating requested fields.
  - Resubmission creates attempt `N+1` while linking existing approved document references.
- **Affected modules/files:**
  - `apps/web/src/app/outlet/[outletKey]/verification/verification-flow-client.tsx`
  - `apps/web/src/lib/actions/merchant-verification.ts`
- **Dependencies:** `BV-007`, `BV-008`
- **Priority:** P1 (High)
- **Complexity:** M
- **Acceptance criteria:**
  - Reviewer's note is displayed clearly near the affected input/document dropzone.
  - Resubmitting updates status back to `submitted` and increments `attempt_number`.
  - Previously accepted documents do not require re-upload.
- **Verification method:** Test cycle: Admin requests changes -> Merchant views notes -> Merchant replaces document -> Resubmits.
- **Responsible role:** Frontend Engineer / Full-Stack Engineer
- **Status:** ✅ `completed`

---

### Phase 5: Admin Panel & Verification Management

#### BV-010
- **Task ID:** `BV-010`
- **Title:** Admin Panel Shell & Navigation Restoration
- **Objective:** Restore and polish the administrative layout shell at `/system-admin` utilizing MENUIN's UI design system and securing it with role-based routing.
- **Context and rationale:** Middleware already protects `/system-admin`, but page components were dropped during the monorepo restructuring. Restoring this shell establishes the home for Verification Admin.
- **Expected changes:**
  - Create `apps/web/src/app/system-admin/layout.tsx` and `admin-sidebar.tsx`.
  - Sidebar navigation items:
    - *Overview* (`/system-admin`)
    - *Merchant Directory* (`/system-admin/tenants`)
    - *Verification Queue* (`/system-admin/verification`)
    - *Payment Gateway (DOKU)* (`/system-admin/payments`)
    - *Audit Trail* (`/system-admin/audit`)
  - Server-side role check in layout: redirects non-admin users to `/auth/login` or shows 403.
- **Affected modules/files:**
  - `apps/web/src/app/system-admin/layout.tsx`
  - `apps/web/src/app/system-admin/admin-sidebar.tsx`
- **Dependencies:** `BV-002`
- **Priority:** P1 (High)
- **Complexity:** M
- **Acceptance criteria:**
  - Authenticated admin can navigate seamlessly across sections.
  - Non-admin user attempting to access `/system-admin` is redirected.
  - Sidebar follows MENUIN design guidelines (Menuin Royal Blue accents, Poppins/Inter, borderless indicators).
- **Verification method:** Access test with admin vs merchant accounts.
- **Responsible role:** Frontend Engineer / Technical Lead
- **Status:** ✅ `completed`

---

#### BV-011
- **Task ID:** `BV-011`
- **Title:** Admin Verification Queue Server Actions
- **Objective:** Implement performant server actions for fetching the review queue with server-side pagination, search, status filtering, and decision execution.
- **Context and rationale:** Per `vercel-react-best-practices`, avoid client waterfalls. Query database with server-side filtering, sorting, and limit/offset pagination.
- **Expected changes:**
  - Create `apps/web/src/lib/actions/admin-verification.ts`:
    - `getVerificationOverviewStats()`: Total, Pending, Action Required, Verified, Rejected counts.
    - `getVerificationQueue(params)`: Filter by status, search by business name/owner, sort by submission date, page & pageSize.
    - `getVerificationDetail(submissionId)`: Complete submission snapshot, document checklist, audit history, and associated outlets.
    - `executeReviewDecision(submissionId, decisionData)`: Handle `APPROVE_INTERNAL`, `REQUEST_CHANGES`, `REJECT`, `ESCALATE` with mandatory confirmation and reason logging.
- **Affected modules/files:**
  - `apps/web/src/lib/actions/admin-verification.ts`
- **Dependencies:** `BV-003`, `BV-010`
- **Priority:** P1 (High)
- **Complexity:** M
- **Acceptance criteria:**
  - Review decisions check `assertPermission(user, 'verification:review')`.
  - Double submissions/decisions prevented via database transaction and status checking.
  - Audit log row generated for every action.
- **Verification method:** Unit tests for review decision execution with various status states.
- **Responsible role:** Backend Engineer / Technical Lead
- **Status:** ✅ `completed`

---

#### BV-012
- **Task ID:** `BV-012`
- **Title:** Admin Verification Overview & Review Queue UI
- **Objective:** Build the review queue interface at `/system-admin/verification` using `@tanstack/react-table`, solid KPI summary cards, filter tabs, search, and pagination.
- **Context and rationale:** Reviewers need to quickly triage pending submissions, identify stale queues, and open detailed reviews efficiently.
- **Expected changes:**
  - Create `apps/web/src/app/system-admin/verification/page.tsx` and `verification-queue-client.tsx`.
  - KPI Cards: Total Pending, Action Required, Verified Today, Average Review Time.
  - Data table:
    - Business Name & Category
    - Owner Name & Email
    - Submission Date & Attempt Number
    - Internal Status Badge (borderless pastel)
    - DOKU Status
    - Action: "Periksa Pengajuan" button
  - Status filter tabs: `Semua`, `Menunggu Pemeriksaan`, `Perlu Perbaikan`, `Terverifikasi`, `Ditolak`.
  - Search input with debounce and URL query state.
- **Affected modules/files:**
  - `apps/web/src/app/system-admin/verification/page.tsx`
  - `apps/web/src/app/system-admin/verification/verification-queue-client.tsx`
- **Dependencies:** `BV-011`, `BV-010`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - Queue loads with Suspense skeleton and zero layout shift.
  - Table empty, loading, and error states properly handled.
  - No mock data: table binds directly to actual database query.
- **Verification method:** End-to-end table filtering, pagination, and navigation to detail page.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-013
- **Task ID:** `BV-013`
- **Title:** Admin Verification Detail & Decision Console
- **Objective:** Build the verification detail page at `/system-admin/verification/[id]` with business profile view, PII masking, secure document viewer, per-document checklist, decision dialogs, and audit timeline.
- **Context and rationale:** Reviewers must examine business legitimacy, verify document validity, provide clear actionable feedback on corrections, and confirm decisions with an audit trail.
- **Expected changes:**
  - Create `apps/web/src/app/system-admin/verification/[id]/page.tsx` and `verification-detail-client.tsx`.
  - Sections:
    1. *Profil Bisnis & Pemilik*: Legal name, category, address, contact, masked NIK/NPWP.
    2. *Checklist Dokumen*: Document cards with "Lihat Dokumen" button (loads 60s signed URL), status selector (`Diterima`, `Perlu Perbaikan`, `Ditolak`), note input per document.
    3. *Status Onboarding DOKU*: Provider reference, sync status, error notes.
    4. *Riwayat Tindakan & Audit*: Vertical timeline showing submission and review events.
    5. *Bilah Aksi Keputusan*:
       - `Minta Perbaikan` (Dialog with bulleted correction checklist).
       - `Tolak Pengajuan` (Dialog with formal rejection reason).
       - `Eskalasi Kasus` (Flag for compliance lead review).
       - `Setujui Verifikasi Internal` (Confirmation dialog explaining next step: DOKU onboarding).
- **Affected modules/files:**
  - `apps/web/src/app/system-admin/verification/[id]/page.tsx`
  - `apps/web/src/app/system-admin/verification/[id]/verification-detail-client.tsx`
  - `apps/web/src/components/verification/document-preview-modal.tsx`
  - `apps/web/src/components/verification/review-decision-dialog.tsx`
- **Dependencies:** `BV-011`, `BV-006`
- **Priority:** P1 (High)
- **Complexity:** XL
- **Acceptance criteria:**
  - Approving internally sets `status = 'verified'` and records reviewer ID + timestamp.
  - Requesting changes requires at least one document or field note to be specified.
  - Sensitive PII (KTP number, bank account) masked by default with "Tampilkan" toggle restricted to authorized reviewers.
  - Document viewer uses short-lived signed URLs.
- **Verification method:** Reviewer flow test covering approve, reject, request changes, and signed URL generation.
- **Responsible role:** Full-Stack Engineer / UI/UX Reviewer
- **Status:** ✅ `completed`

---

### Phase 6: DOKU Onboarding & Integration Layer

#### BV-014
- **Task ID:** `BV-014`
- **Title:** DOKU Sub Account V2 Lifecycle & Provider Contract Integration
- **Objective:** Connect the team's newly introduced DOKU Sub Account V2 implementation (`apps/web/src/lib/payments/doku/sub-account.ts`) to the MENUIN verification domain model.
- **Context and rationale:** The team has confirmed and implemented `createSubAccount` using DOKU SNAP V2 (`POST /sub-account/v2.0/register`). This task formalizes the provider contract adapter, mapping DOKU `profileId` (e.g. `SAC-xxxx`) and status into `provider_onboardings` and `tenants.doku_sub_account_id`.
- **Expected changes:**
  - Create `apps/web/src/lib/verification/doku-adapter.ts` wrapping `apps/web/src/lib/payments/doku/sub-account.ts`.
  - Map DOKU statuses to internal provider status:
    - `ACTIVE` -> `active`
    - `PENDING` -> `pending_review`
    - `REJECTED` -> `rejected`
    - `SUSPENDED` -> `suspended`
  - Record provider onboarding record in `provider_onboardings` linked to `business_profiles.id` and `tenants.id`.
- **Affected modules/files:**
  - `apps/web/src/lib/verification/doku-adapter.ts`
  - `apps/web/src/lib/payments/doku/sub-account.ts`
- **Dependencies:** `BV-001`, `BV-003`
- **Priority:** P1 (High)
- **Complexity:** M
- **Acceptance criteria:**
  - Adapter cleanly interfaces with `createSubAccount` in `apps/web/src/lib/payments/doku/sub-account.ts`.
  - Maps `profileId` into both `provider_onboardings` and `tenants.doku_sub_account_id`.
  - Handles DOKU API errors (`DokuApiError`) gracefully without leaving dangling unrecorded states.
- **Verification method:** Unit tests verifying adapter status mapping and successful mock sub-account registration.
- **Responsible role:** DOKU Integration Reviewer / Backend Engineer
- **Status:** ✅ `completed`
- **Implementation notes (update):**
  - Adapter berada di `apps/web/src/lib/payments/doku/doku-adapter.ts` (bukan `lib/verification/`).
  - Pemetaan status ada di `mapDokuSubAccountStatus` (`sub-account.ts`) dengan nilai internal huruf besar (`ACTIVE`, `PENDING_REVIEW`, `SUSPENDED`, `FAILED`); status tidak dikenal → `PENDING_REVIEW`.
  - Fallback ID buatan (`SAC-SANDBOX-…`) dan pengisian QRIS dummy dihapus: kegagalan DOKU → `FAILED`, bisa dicoba ulang.
  - Diuji di `doku-adapter.integration.test.ts` (Postgres, API DOKU di-mock).

---

#### BV-015
- **Task ID:** `BV-015`
- **Title:** Guarded Sub-Account Activation & Concurrency Lock Enhancement
- **Objective:** Integrate the business verification gate directly into `activateDokuSubAccount` in `apps/web/src/lib/actions/settings.ts` and add auto-provisioning upon admin approval.
- **Context and rationale:** The team's `activateDokuSubAccount` already implements a robust concurrency lock (`SUB_ACCOUNT_PROVISIONING`). However, it currently lacks a check for business verification status. This task enforces that sub-account creation only runs if `business_profiles.status === 'verified'`, and enables optional auto-provisioning during admin approval with manual fallback.
- **Expected changes:**
  - Update `activateDokuSubAccount` in `apps/web/src/lib/actions/settings.ts`:
    - Add prerequisite check: `assertBusinessVerified(user.tenantId)`. If unverified, reject with clear error guidance.
    - Retain DB concurrency lock (`SUB_ACCOUNT_PROVISIONING`, 2-min stale timeout).
  - Update Admin verification decision handler (`apps/web/src/lib/actions/verification-review.ts`):
    - When admin approves business verification, optionally trigger initial sub-account provisioning for the primary outlet.
  - Implement manual sub-account linking fallback in `/system-admin/payments` for operations.
- **Affected modules/files:**
  - `apps/web/src/lib/actions/settings.ts`
  - `apps/web/src/lib/actions/verification-review.ts`
  - `apps/web/src/app/system-admin/payments/page.tsx`
- **Dependencies:** `BV-014`, `BV-003`, `BV-006`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - Unverified merchants calling `activateDokuSubAccount` receive 403 Forbidden with message "Verifikasi bisnis wajib disetujui terlebih dahulu."
  - Verified merchants successfully provision sub-account or retry if previous attempt failed.
  - Admin can view sub-account status per outlet and manually link sub-account ID if needed.
- **Verification method:** Integration test asserting activation blocked before verification and permitted after approval.
- **Responsible role:** Backend Engineer / Security Reviewer
- **Status:** ✅ `completed`
- **Implementation notes (update):**
  - Lock `PROVISIONING` dipindah dari `activateDokuSubAccount` ke `provisionDokuSubAccountForTenant`, sehingga jalur Pengaturan dan Verifikasi sama-sama terlindungi dari registrasi ganda.
  - Manual fallback `/system-admin/payments` baru diimplementasikan belakangan: `lib/payments/doku/sub-account-admin.ts`, `lib/actions/admin-payments.ts`, izin `payments:manage_provider` (SYSTEM_ADMIN/SUPERADMIN). Fitur: daftar status per outlet, tautkan ID manual, ubah status, daftar ulang; semua tercatat di audit log.
  - SOP operasional: `OPERATIONAL_RUNBOOK.md` §6.
  - Belum: sinkronisasi status otomatis dari DOKU.

---

### Phase 7: Server-Side Payment-Readiness Enforcement

#### BV-016
- **Task ID:** `BV-016`
- **Title:** Unified Server-Side Payment Readiness Engine & Catalog Gate
- **Objective:** Implement a unified payment readiness engine (`evaluatePaymentReadiness`) and guard catalog ordering settings against premature online payment enablement.
- **Context and rationale:** `apps/web/src/lib/actions/catalog.ts` currently permits setting `onlinePaymentEnabled = true` without checking verification status. Similarly, `availability.ts` only checks tenant sub-account presence. This task builds a centralized, pure evaluation engine and guards both settings actions.
- **Expected changes:**
  - Create `apps/web/src/lib/verification/payment-readiness.ts`:
    - `evaluatePaymentReadiness(tenantId)`:
      1. Platform configured (`isDokuConfigured()`).
      2. Business Profile linked and status is `verified` (Tier 1 passed).
      3. Outlet Compliance status is `verified` (Tier 2 location and storefront passed).
      4. Tenant has `doku_sub_account_id` and `doku_sub_account_status === 'ACTIVE'` (Gateway onboarding passed).
      5. Merchant toggle `online_payment_enabled === true`.
    - Returns `{ isReady: boolean, reason?: string, missingRequirements: string[] }`.
  - Update `updateOrderingSettings` in `apps/web/src/lib/actions/catalog.ts`:
    - If `onlinePaymentEnabled` is requested, call `evaluatePaymentReadiness`.
    - If not ready, reject with descriptive error: "Pembayaran online belum dapat diaktifkan sebelum verifikasi bisnis disetujui, verifikasi outlet selesai, dan akun pembayaran DOKU aktif."
  - Update `isOnlinePaymentAvailable` in `apps/web/src/lib/payments/availability.ts` to consume the readiness engine.
- **Affected modules/files:**
  - `apps/web/src/lib/verification/payment-readiness.ts`
  - `apps/web/src/lib/actions/catalog.ts`
  - `apps/web/src/lib/payments/availability.ts`
- **Dependencies:** `BV-003`, `BV-014`, `BV-015`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - Pure function unit tests cover 100% of readiness branch conditions.
  - Catalog ordering action blocks unverified merchants from enabling online payments.
  - Returns clear, actionable Indonesian error messages.
- **Verification method:** Unit tests in `payment-readiness.test.ts` and server action integration test.
- **Responsible role:** Security Reviewer / Backend Engineer
- **Status:** ✅ `completed`

---

#### BV-017
- **Task ID:** `BV-017`
- **Title:** Runtime Checkout & POS QRIS Payment Execution Guard
- **Objective:** Enforce payment readiness check during transaction checkout and dynamic QRIS generation at runtime in `payment.service.ts`.
- **Context and rationale:** Even if `onlinePaymentEnabled` was previously set, if a merchant is suspended or revoked, runtime QRIS generation must immediately reject payment requests before creating DOKU charges.
- **Expected changes:**
  - In `apps/web/src/lib/payments/payment.service.ts`:
    - In `startOrderPayment`: Call `evaluatePaymentReadiness(params.tenantId)`. If not ready, return `startError('ORDER', 'NOT_VERIFIED')`.
    - In `startQrisPayment`: Call `evaluatePaymentReadiness(params.tenantId)`. If not ready, return `startError('POS_QRIS', 'NOT_VERIFIED')`.
  - Update checkout page `/store/[slug]/checkout` and POS error banners to display clear explanation when payment is unavailable.
- **Affected modules/files:**
  - `apps/web/src/lib/payments/payment.service.ts`
  - `apps/web/src/app/store/[slug]/checkout/checkout-client.tsx`
- **Dependencies:** `BV-016`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Acceptance criteria:**
  - POS cashier and customer checkout cannot generate DOKU QRIS or hosted checkout for unverified or suspended outlets.
  - Cash payment and manual QRIS remain functional (zero regression on core POS).
- **Verification method:** Simulated checkout API call for unverified vs verified tenant.
- **Responsible role:** Full-Stack Engineer / QA Reviewer
- **Status:** ✅ `completed`

---

### Phase 8: MENUIN Care Integration

#### BV-018
- **Task ID:** `BV-018`
- **Title:** MENUIN Care Contextual Verification Bridge
- **Objective:** Enable contextual support linking between verification submissions and customer care without giving Care agents verification decision authority.
- **Context and rationale:** When a merchant has an issue with their verification (`action_required` or `rejected`), they can click "Bantuan Verifikasi" to create or view a support ticket. Care agents can view high-level status but cannot approve/reject.
- **Expected changes:**
  - In `verification-flow-client.tsx`, add "Bantuan Verifikasi" button pre-populating a support inquiry with `submission_id`.
  - In Care ticket data model / helper, add nullable `verificationSubmissionId` reference.
  - Care agent view displays summary: Business Name, Submission Date, Public Status, Public Notes. Review decision controls are completely omitted.
- **Affected modules/files:**
  - `apps/web/src/app/outlet/[outletKey]/verification/verification-flow-client.tsx`
  - `apps/web/src/lib/services/care-bridge.service.ts`
- **Dependencies:** `BV-001`, `BV-002`
- **Priority:** P2 (Medium)
- **Complexity:** S
- **Acceptance criteria:**
  - Care agents cannot see raw unmasked NIK or signed document URLs.
  - Care ticket displays verified link to submission.
  - Zero decision mutation endpoints exposed to Care role.
- **Verification method:** Role permission test for Care agent account viewing a verification-linked ticket.
- **Responsible role:** Full-Stack Engineer / Security Reviewer
- **Status:** ✅ `completed`

---

### Phase 9: Comprehensive Security, Testing & Regression Prevention

#### BV-019
- **Task ID:** `BV-019`
- **Title:** Security & Authorization Automated Test Suite
- **Objective:** Create comprehensive automated test suite verifying tenant isolation, reviewer RBAC, private document protection, and signed URL expiration.
- **Context and rationale:** Business verification handles sensitive merchant PII and financial readiness. Security tests must run in CI to prevent regression.
- **Expected changes:**
  - Create test files:
    - `apps/web/src/__tests__/verification/authorization.test.ts`
    - `apps/web/src/__tests__/verification/tenant-isolation.test.ts`
    - `apps/web/src/__tests__/verification/document-security.test.ts`
  - Tests verify:
    - Cross-tenant data access blocked (Merchant X cannot read Merchant Y's submission).
    - Non-admin calling `executeReviewDecision` receives 403 Forbidden.
    - Signed URL generated for Document X cannot be accessed after 60 seconds.
    - Attempting to access bucket directly without signed token returns 403.
- **Affected modules/files:**
  - `apps/web/src/__tests__/verification/*`
- **Dependencies:** `BV-002`, `BV-006`, `BV-016`
- **Priority:** P0 (Critical)
- **Complexity:** L
- **Acceptance criteria:**
  - 100% of negative security test cases pass.
  - Zero leakage of raw PII in test assertions and error messages.
- **Verification method:** Execute automated test runner (`npm test --workspace=web`).
- **Responsible role:** Security Reviewer / QA Reviewer
- **Status:** ✅ `completed`

---

#### BV-020
- **Task ID:** `BV-020`
- **Title:** State Machine & Verification Flow Integration Tests
- **Objective:** Automated integration tests covering the end-to-end verification lifecycle: Draft -> Submit -> Review -> Request Changes -> Resubmit -> Approve -> Link DOKU -> Enable Payments.
- **Context and rationale:** Ensures all state transitions, snapshots, audit log entries, and payment gates work cohesively across the entire flow.
- **Expected changes:**
  - Create `apps/web/src/__tests__/verification/verification-flow.integration.test.ts`.
  - Simulate full scenario:
    1. Merchant creates draft.
    2. Merchant uploads documents and submits.
    3. Reviewer claims submission (`under_review`).
    4. Reviewer marks KTP `REJECTED` and status `action_required`.
    5. Merchant uploads replacement KTP and resubmits (`attempt_number: 2`).
    6. Reviewer approves internal verification (`verified`).
    7. DOKU onboarding marked `active`.
    8. Payment readiness gate passes and online payments can be enabled.
- **Affected modules/files:**
  - `apps/web/src/__tests__/verification/verification-flow.integration.test.ts`
- **Dependencies:** `BV-007`, `BV-011`, `BV-016`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - Entire state lifecycle executes with matching audit log events.
  - Snapshot integrity verified at each revision.
- **Verification method:** Integration test execution with isolated test database.
- **Responsible role:** QA Reviewer / Full-Stack Engineer
- **Status:** ✅ `completed`

---

#### BV-021
- **Task ID:** `BV-021`
- **Title:** End-to-End Regression & Accessibility (a11y) Verification
- **Objective:** Verify existing core functionalities (POS checkout, order processing, cashflow reports, catalog management) remain completely unaffected, and verify WCAG AA accessibility compliance on all new verification UI.
- **Context and rationale:** Adding verification must not break cash/manual payments or existing restaurant workflows. UI must comply with WCAG AA (contrast 4.5:1, keyboard navigation, aria-labels).
- **Expected changes:**
  - Run regression checks on `/outlet/[outletKey]/pos`, `/outlet/[outletKey]/reports`, `/outlet/[outletKey]/settings`.
  - Run accessibility audit on Merchant Verification page and Admin Verification console:
    - Tap targets >= 44x44px.
    - Focus visible rings on all inputs and buttons.
    - Aria-labels on icon buttons and status indicators.
    - Mobile collapse without horizontal overflow at 320px, 375px, 414px.
- **Affected modules/files:**
  - Entire web application test suite
- **Dependencies:** `BV-008`, `BV-012`, `BV-013`
- **Priority:** P1 (High)
- **Complexity:** M
- **Acceptance criteria:**
  - POS cash and existing non-DOKU payment methods continue working with zero errors.
  - Zero TypeScript, ESLint, or Next.js build errors.
  - Lighthouse accessibility score >= 95 on new verification pages.
- **Verification method:** Run `npm run build --workspace=web`, automated a11y scanner, and manual POS smoke test.
- **Responsible role:** QA Reviewer / UI/UX Reviewer
- **Status:** ✅ `completed`

---

### Phase 10: Documentation & Operational Runbook

#### BV-022
- **Task ID:** `BV-022`
- **Title:** Verification Operational Runbook & Reviewer SOP
- **Objective:** Document standard operating procedures for internal compliance reviewers, escalation workflows, fraud indicators, and DOKU sub-account management.
- **Context and rationale:** Compliance teams need clear operational guidelines on what constitutes acceptable evidence, how to handle edge cases (e.g. franchise outlets, home catering without storefront), and escalation criteria.
- **Expected changes:**
  - Create `docs/verify-bisnis/OPERATIONAL_RUNBOOK.md`:
    - Checklist for KTP, NPWP, and NIB review.
    - Guidelines for individual vs. entity merchants.
    - Escalation protocol to Legal/Compliance Lead.
    - Fraud red flags (mismatched names, stolen identities, prohibited F&B goods).
    - DOKU sub-account onboarding troubleshooting guide.
- **Affected modules/files:**
  - `docs/verify-bisnis/OPERATIONAL_RUNBOOK.md`
- **Dependencies:** All previous tasks
- **Priority:** P2 (Medium)
- **Complexity:** S
- **Acceptance criteria:**
  - Runbook is clear, comprehensive, and approved by operations.
- **Verification method:** Documentation review.
- **Responsible role:** Technical Lead / Planning Owner
- **Status:** ✅ `completed`

---

#### BV-023
- **Task ID:** `BV-023`
- **Title:** Enterprise Form Radius Standardization & Mandatory Skill Utilization Protocol
- **Objective:** Eliminate bubbly, amateurish over-rounded form fields across the verification wizard, aligning with the crisp, clean enterprise standard seen in Xendit/Linear, and permanently establish the mandatory protocol to apply installed agent skills in all workflows.
- **Context and rationale:** Inherited Tailwind `rounded-lg` (12px) caused form fields, entity chips, and card containers to look like pill bubbles ("AI slop"). Enterprise fintech standards require sharp geometric precision (`rounded-[6px]` for inputs/containers, `rounded-[4px]` for nested action buttons/badges). User requested preserving sidebar/stepper and strictly applying installed skills.
- **Expected changes:**
  - Standardize all inputs, textareas, entity buttons, and upload zones to `rounded-[6px]`.
  - Update secondary action buttons ("Pilih File", preview badges) to `rounded-[4px]`.
  - Standardize footer and header action buttons to `rounded-[6px]`.
  - Leave sidebar and stepper untouched.
  - Document mandatory skill protocol in `decision-log.md` and `task-register.md`.
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/wizard/guideline-panel.tsx`
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-022`
- **Priority:** P1 (High)
- **Complexity:** S
- **Acceptance criteria:**
  - Input field corners are crisp and subtle (`rounded-[6px]`), matching the Xendit reference.
  - Sidebar and stepper remain preserved without regressions.
  - TypeScript types compile with zero errors.
  - Vitest test suite passes.
- **Verification method:** Automated typecheck (`tsc --noEmit`), test suite execution, and visual verification via browser subagent.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-024
- **Task ID:** `BV-024`
- **Title:** Direct-Click Full-Surface Upload Dropzone (Removal of Redundant 'Pilih File' Button)
- **Objective:** Convert the upload zone into a single direct-action clickable card across all verification steps and remove the redundant nested "Pilih File" button for effortless usability.
- **Context and rationale:** Users previously had to specifically click a small button on the far right. Making the entire card surface responsive to clicks (`cursor-pointer`) and keyboard interactions (`Enter`/`Space`) improves ease of use and mobile/desktop ergonomics.
- **Expected changes:**
  - Remove `<button>Pilih File</button>` in `apps/web/src/components/verification/shared/upload-zone.tsx`.
  - Add full container `onClick`, `role="button"`, `tabIndex`, and `onKeyDown`.
  - Add interactive hover state (`group-hover:bg-[#0e59f9] group-hover:text-white`).
  - Isolate delete button click using `e.stopPropagation()` when file is attached.
  - Document in `decision-log.md` and `task-register.md`.
- **Affected modules/files:**
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-023`
- **Priority:** P1 (High)
- **Complexity:** XS
- **Acceptance criteria:**
  - Clicking anywhere on the upload card triggers the native file selector.
  - "Pilih File" button is completely absent.
  - All upload fields in Step 1, Step 2, Step 3, and Step 4 reflect this behavior.
  - Automated tests and TypeScript checks pass.
- **Verification method:** Browser subagent inspection and type checking.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-025
- **Task ID:** `BV-025`
- **Title:** Searchable Enterprise Dropdown for Legal Entity Selection (Clean Flat List Specification)
- **Objective:** Implement a dedicated, non-generic searchable combobox dropdown for business legal entity selection in Step 1 (Profil Usaha) with a clean flat list (no category headers, no descriptions) and neutral active state (black checkmark only).
- **Context and rationale:** Generic Radix Select component experienced portal layering and click freeze issues. A dedicated, self-contained searchable dropdown guarantees 100% reliable clickability, interactive search filtering, clean single-line options, dual-arrow `ChevronsUpDown` trigger, and neutral styling without blue/purple fills as requested.
- **Expected changes:**
  - Update `apps/web/src/components/verification/shared/entity-dropdown.tsx`.
  - Wire into `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`.
  - Provide humanized labels in `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`.
  - Document in `decision-log.md` and `task-register.md`.
- **Affected modules/files:**
  - `apps/web/src/components/verification/shared/entity-dropdown.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-024`
- **Priority:** P1 (High)
- **Complexity:** S
- **Acceptance criteria:**
  - Dropdown opens instantly upon clicking the trigger without freeze or portal errors.
  - Options rendered as a clean flat list without category headers or description subtitles.
  - Active option retains normal dark text color and clean background, displaying only a black checkmark.
  - Search bar allows instant filtering across entity names.
  - Selecting an entity updates form data and closes the dropdown smoothly.
  - Automated tests and TypeScript checks pass.
- **Verification method:** Browser subagent inspection and type checking.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-026
- **Task ID:** `BV-026`
- **Title:** Removal of "Mode Pratinjau Dokumen" Warning Banner & Field-Level Click Sonner Toast Guard
- **Objective:** Enable merchants to freely browse any wizard step to inspect required documents while completely removing the intrusive yellow alert banner, and guard incomplete steps with an interactive Sonner toast whenever any form field is clicked.
- **Context and rationale:** Merchants need to plan ahead and see what documents and information are needed in later steps. Having an intrusive yellow warning banner created visual clutter. Allowing free tab switching with full visibility, but guarding against premature edits via a transparent field-level click interceptor that triggers Sonner toast notifications, creates an intuitive and premium UX.
- **Expected changes:**
  - Remove the yellow preview warning banner from `apps/web/src/components/verification/wizard/wizard-shell.tsx`.
  - Allow unrestricted step navigation in `WizardStepper` (`onStepClick={setCurrentStep}`).
  - Add transparent overlay over form canvas during preview mode (`currentStep > firstIncompleteStep`) that intercepts field clicks and triggers `toast.warning('Selesaikan pengisian dokumen Langkah [X] ([Nama]) terlebih dahulu.')`.
  - Pass `isPreviewOnly` to keep form inputs disabled in preview mode.
  - Render `Lengkapi Langkah [X]` button in footer during preview mode for quick return to the active step.
  - Document in `decision-log.md` and `task-register.md`.
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-025`
- **Priority:** P1 (High)
- **Complexity:** XS
- **Acceptance criteria:**
  - Yellow "Mode Pratinjau Dokumen" banner is completely gone from the UI.
  - Merchants can freely open any step (Step 1 to Step 5) to review required documents and guidelines.
  - Clicking on any field in a preview step triggers a Sonner toast: `"Selesaikan pengisian dokumen Langkah X (Nama Langkah) terlebih dahulu."`.
  - User cannot fill or alter data on incomplete steps.
  - Footer provides a single-click "Lengkapi Langkah X" button to return to the active step.
  - Automated tests and TypeScript checks pass.
- **Verification method:** Browser subagent inspection and type checking.
---

#### BV-027
- **Task ID:** `BV-027`
- **Title:** Business Representative (PIC) Step 2 Design & Data Alignment
- **Objective:** Redesign Step 2 ("Perwakilan Bisnis") to match the user's reference design with 6 specific fields, calibrated input styling, custom dropdown selectors, phone prefix containerization, half-width alignment for NIK and KTP, and an attached upload card.
- **Context and rationale:** The user provided an exact reference design showing the complete data and layout for the business representative / owner (`Muhammad Zidane Elfasya`, `Pemilik`, `+62 82235594074`, `menuindigitalsolusindo@gmail.com`, `Indonesia`, `3510162604030008`, and attached e-KTP card).
- **Expected changes:**
  - Update `Step2Representative` in `step-2-representative.tsx` to support all 6 fields:
    1. `Nama Penanggung Jawab`: Text input (full width).
    2. `Jabatan di Company`: Dropdown selector with `ChevronsUpDown` (full width).
    3. `Nomor Telepon`: Country code selector (`62 ↕`) + `+62` visual prefix input.
    4. `Email`: Text input.
    5. `No. KTP (NIK)`: 16-digit mono input (half width).
    6. `Kartu Tanda Penduduk`: Upload card with thumbnail preview and `Ketuk di sini untuk membuka` (half width).
  - Update `UploadZone` in `upload-zone.tsx` with dashed border (`border-[#CED3DC]`), light gray background (`#E4E7EC`), and clean presentation.
  - Wire state in `wizard-shell.tsx`: initialize `representativeFormData` with reference data fallback, pass `ktpPreviewUrl`, update `handleDocumentUpload`/`handleDocumentRemove`, and validate in `handleNextStep`.
  - Update `Step5Review` to render all 6 representative fields in the final summary.
  - Document in `decision-log.md` (Decision 27) and `task-register.md`.
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-026`
- **Priority:** P1 (High)
- **Complexity:** S
- **Acceptance criteria:**
  - Step 2 visually and structurally matches the user's reference screenshot 1-to-1.
  - All 6 fields are present and pre-populated with reference owner data.
  - Corner radius is `rounded-[6px]`, backgrounds are `#E4E7EC`, borders are `#CED3DC`, and typography adheres to Menuin zero-bold standard.
  - NIK and KTP upload card are half-width aligned with Column 1.
  - KTP card shows clean thumbnail preview and is fully clickable.
  - Automated tests and TypeScript typechecks pass with 0 errors.
- **Verification method:** Browser subagent inspection and type checking.
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-028
- **Task ID:** `BV-028`
- **Title:** Multi-Tenant Business Profile & Settlement Account Isolation (Employee / Manager Boundary)
- **Objective:** Fix multi-tenant data leakage where business legal profiles and bank accounts of an outlet owner become visible or linkable to an invited employee when that employee creates a new outlet.
- **Context and rationale:** In Menuin, an owner can invite an employee (e.g. cashier or manager). Under the flawed previous implementation, if a manager accessed onboarding or if seed data linked multiple tenants, business profiles and settlement accounts were associated across tenant boundaries. The user confirmed Option A (strict lockdown: only OWNER can access the verification onboarding wizard and perform mutations; MANAGER can only view the overview in read-only mode), along with database cleanup.
- **Expected changes:**
  - Update `packages/permissions`: add `MANAGE_LEGAL`, `MANAGE_FINANCE`, `SUBMIT_ONBOARDING` to `Role.OWNER` and `Role.SYSTEM_ADMIN`/`Role.SUPERADMIN`, deny to `Role.MANAGER`, `Role.CASHIER`, `Role.STAFF`.
  - Update `apps/web/src/lib/actions/merchant-verification.ts`:
    - In `getOutletVerificationOverview`: return `availableProfiles` only if caller is `OWNER`. Verify `tenant.businessProfileId` belongs to an active `OWNER` of the tenant; otherwise unlink (`self-heal`). Return `isOwner` flag.
    - In `linkOutletToBusinessProfileAction`: strictly require `membership.role === 'OWNER'` and caller account ownership of profile.
    - In `submitOutletComplianceAction`: strictly require `membership.role === 'OWNER'`.
    - In `activateOutletPaymentAction`: strictly require `membership.role === 'OWNER'`.
  - Update `apps/web/src/lib/actions/settlement-accounts.ts`:
    - In `linkOutletSettlementAccountAction`: strictly require `membership.role === 'OWNER'` and caller ownership of business profile.
  - Update `apps/web/src/app/outlet/[outletKey]/verification/onboarding/page.tsx`:
    - Hard guard: only `user.role === 'OWNER'` or `SYSTEM_ADMIN` can access onboarding wizard. Non-owners receive an informative lock screen card.
  - Update Hub & Client components:
    - `ringkasan-client.tsx`: render non-owner informative banner and pass `isOwner` to `StatusHeroCard`.
    - `status-hero-card.tsx`: render "Akses Khusus Pemilik (Mode Lihat)" for non-owners.
    - `business-client.tsx`, `representative-client.tsx`, `settlement-client.tsx`, `outlet-client.tsx`: hide edit and onboarding buttons for non-owners.
  - Database Remediation & Seed Fix:
    - Run DB remediation unlinking cross-tenant contaminated outlets (`Kopi Asalam`, `Mie Gacoan`, `kopi asal`).
    - Fix `seed-verification.ts` to only link tenants owned by `mainAccount.id`.
  - Automated tests: update `packages/permissions/src/permissions.test.ts` and `apps/web/src/lib/verification/security.test.ts`.
  - Document in `decision-log.md` (Decision 28) and `task-register.md` (Task BV-028).
- **Affected modules/files:**
  - `packages/permissions/src/permissions.ts`
  - `packages/permissions/src/permissions.test.ts`
  - `apps/web/src/lib/actions/merchant-verification.ts`
  - `apps/web/src/lib/actions/settlement-accounts.ts`
  - `apps/web/src/app/outlet/[outletKey]/verification/onboarding/page.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/page.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/ringkasan-client.tsx`
  - `apps/web/src/components/verification/hub/status-hero-card.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/business/business-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/representative/representative-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/settlement/settlement-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/outlet/outlet-client.tsx`
  - `apps/web/src/lib/db/seed-verification.ts`
  - `apps/web/src/lib/verification/security.test.ts`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-002`, `BV-007`, `BV-019`, `BV-027`
- **Priority:** P0 (Critical Security & Multi-Tenant Data Isolation)
- **Complexity:** M
- **Acceptance criteria:**
  - Non-owners (e.g. `MANAGER`, `CASHIER`) cannot access the onboarding wizard.
  - Non-owners cannot link, update, or submit business profiles or settlement accounts via server actions (403 Forbidden).
  - Outlets owned by employee accounts never inherit or display business profiles or bank accounts of other merchants.
  - Owners can still link and reuse their own business profiles and settlement accounts across their own outlets seamlessly.
  - Zero-bold styling is strictly maintained across all UI components.
  - All automated tests in permissions and verification suites pass.
- **Verification method:** Vitest automated test suite, database isolation check query, and TypeScript typechecking.
- **Responsible role:** Security Reviewer / Full-Stack Engineer
- **Status:** ✅ `completed`

---

#### BV-029
- **Task ID:** `BV-029`
- **Title:** Zero Default Values (Placeholder-First) & Unrestricted Stepper Preview Browsing
- **Objective:** Eliminate all default prefilled form mock values across all verification wizard steps, rely purely on clear placeholder guides, and ensure merchants can freely click any upcoming step on the stepper timeline to preview required documents and legal data.
- **Context and rationale:** 
  - Mock and seed data previously populated fields (names, NIK, phone, email, sample KTP image, bank BCA, and seed address data), which caused confusion when merchants wanted to start fresh.
  - Merchants need the ability to click ahead to any future step at will to inspect what documents are required so they can prepare them, while input fields on incomplete steps remain in read-only preview mode protected by field-click Sonner toasts and one-click return to the active step.
- **Expected changes:**
  - Initialize all form states to empty (`''`, `{}`, `null`) in `wizard-shell.tsx`.
  - Revert step-click blocking in `wizard-shell.tsx` and `wizard-stepper.tsx`, allowing full direct clicking (`onStepClick={setCurrentStep}`).
  - Maintain field-level click interception in preview mode via Sonner toast warning.
  - Clear legacy seed addresses on unverified outlets in the database.
  - Update `decision-log.md` (Decision 29) and `task-register.md` (Task BV-029).
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `apps/web/src/components/verification/wizard/wizard-stepper.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `apps/web/src/components/verification/shared/nationality-dropdown.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-026`, `BV-027`, `BV-028`
- **Priority:** P1 (High UX & Verification Accuracy)
- **Complexity:** S
- **Acceptance criteria:**
  - All form fields start empty with visible placeholders.
  - Clicking any step on the stepper timeline navigates directly to that step.
  - Previewing an incomplete future step displays required fields/cards cleanly with `"Lengkapi Langkah [X] ->"` in the footer.
  - Clicking an input on an incomplete preview step triggers the informative Sonner toast warning.
  - All automated tests and TypeScript checks pass.
- **Verification method:** Browser subagent walkthrough, manual navigation testing, and type checking (`tsc --noEmit`).
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-030
- **Task ID:** `BV-030`
- **Title:** UI/UX Dropdown Architecture Standardization (Combobox Source of Truth)
- **Objective:** Standardize all dropdown selection inputs across the MENUIN verification wizard into the modern custom popover combobox architecture established by `EntityDropdown` (Bentuk Entitas Usaha) and `SearchableDropdown` (Wilayah Administrasi), eliminating all legacy native HTML `<select>` elements and recording the pattern in the project's Source of Truth.
- **Context and rationale:** 
  - The "Jabatan di Company" dropdown and the phone country code selector in Step 2 used legacy native `<select>` tags styled with an absolute icon overlay. This produced an outdated ("kuno"), inconsistent look that broke away from the sleek popover style used elsewhere in the wizard.
  - The phone number input also displayed duplicate country code prefixes (`62` in the select box and `+62` floating text inside the input).
  - The user explicitly requested standardizing UI/UX consistency across all dropdowns (matching bentuk entitas, provinsi, kabupaten) and documenting this directly in the Source of Truth (`decision-log.md` and `task-register.md`) so that all agents and developers adhere to this standard.
- **Expected changes:**
  - Build `PositionDropdown` (`apps/web/src/components/verification/shared/position-dropdown.tsx`) implementing:
    - Trigger height `h-10 rounded-[6px] border px-3.5 text-sm font-normal text-slate-900` with dual arrow `ChevronsUpDown`.
    - Floating popover panel (`border-slate-200 rounded-[6px] shadow-lg animate-in`).
    - Filterable search input with `Search` and clear `X` icon.
    - Flat option items with neutral dark checkmark indicator (`Check className="w-4 h-4 text-slate-900 stroke-[2]"`).
    - Unselected placeholder `Pilih jabatan di perusahaan...` in `text-slate-400`.
  - Update `Step2Representative` in `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`:
    - Replace native `<select>` with `<PositionDropdown />`.
    - Replace redundant phone select + floating prefix with a clean dedicated prefix badge `<div className="w-14 h-10 rounded-[6px] border border-slate-300 bg-slate-50 flex items-center justify-center text-sm font-medium text-slate-700 select-none flex-shrink-0">+62</div>` and standard input padding (`px-3.5`).
  - Update `docs/verify-bisnis/decision-log.md` with Decision 30 specifying the Dropdown Architecture Design System.
  - Update `docs/verify-bisnis/task-register.md` with Task BV-030.
- **Affected modules/files:**
  - `apps/web/src/components/verification/shared/position-dropdown.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-025`, `BV-027`
- **Priority:** P1 (High UI/UX Consistency)
- **Complexity:** S
- **Acceptance criteria:**
  - "Jabatan di Company" dropdown uses the custom popover combobox with search and checkmark.
  - No native HTML `<select>` elements exist in the verification wizard.
  - Phone input has a unified clean `+62` badge without redundant labels.
  - All dropdown specifications are codified in Decision 30 of `decision-log.md`.
  - Full TypeScript typecheck passes with zero errors.
- **Verification method:** Browser subagent walkthrough, manual verification, and type checking (`tsc --noEmit`).
- **Responsible role:** UI/UX Lead / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-031
- **Task ID:** `BV-031`
- **Title:** Global Interactive Lock & Upload Loading Guard
- **Objective:** Strictly disable and lock all buttons, inputs, dropdowns, and stepper navigation across the entire verification wizard when an image or document upload is in progress, preventing race conditions, state corruption, and system errors.
- **Context and rationale:** 
  - Asynchronous uploads take time to process and upload to private S3 storage.
  - If a user clicks "Simpan & Lanjutkan", "Kembali", "Simpan & Keluar", or switches tabs in the stepper timeline while an upload is underway, incomplete payloads or interrupted network requests could cause application errors or orphaned files.
  - The user explicitly requested making all buttons inactive and unclickable during the loading state of document/image uploads.
- **Expected changes:**
  - Update `apps/web/src/components/verification/wizard/wizard-shell.tsx`:
    - Disable footer buttons: `Kembali` (`disabled={currentStep === 1 || isSubmitting || isUploading}`), `Lengkapi Langkah` (`disabled={isUploading || isSubmitting}`), and `Simpan & Lanjutkan` (`disabled={isSubmitting || isUploading || ...}`).
    - Dynamically show `<Loader2 className="w-4 h-4 animate-spin text-white" /> <span>Mengunggah Dokumen...</span>` on the primary footer button during upload.
    - Disable header `Simpan & Keluar` action during upload/submission by replacing the link with a disabled button (`opacity-60 cursor-not-allowed`).
    - Pass `disabled={isUploading || isSubmitting}` to `WizardStepper`.
    - Intercept canvas clicks via `onClickCapture`: block and notify user with `toast.info('Mohon tunggu, proses upload dokumen sedang berlangsung...')`.
  - Update `apps/web/src/components/verification/wizard/wizard-stepper.tsx`:
    - Accept `disabled?: boolean` and mark all step navigation buttons as disabled with `cursor-not-allowed opacity-60`.
  - Update `apps/web/src/components/verification/shared/upload-zone.tsx`:
    - Mark dropzone as `cursor-not-allowed opacity-60` during `isUploading`.
    - Disable thumbnail button (`upload-thumb-btn`), filename button (`upload-filename-btn`), replace button (`upload-replace-btn`), and remove button (`upload-remove-btn`) when `isUploading` is true.
  - Update `Step1BusinessProfile`, `Step2Representative`, `Step3Settlement`, `Step4Outlet`, `Step5Review`:
    - Guard all inputs, textareas, dropdowns, and action buttons with `disabled={isPreviewOnly || isUploading}`.
  - Document in `decision-log.md` (Decision 31) and `task-register.md` (Task BV-031).
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `apps/web/src/components/verification/wizard/wizard-stepper.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-024`, `BV-030`
- **Priority:** P1 (High Reliability & Data Integrity)
- **Complexity:** S
- **Acceptance criteria:**
  - When an upload is active, `isUploading` propagates to all screen controls.
  - All buttons (Kembali, Simpan & Lanjutkan, Lengkapi Langkah, Simpan & Keluar, Stepper tabs, Ganti, Hapus, Ubah) are disabled and cannot be clicked.
  - Primary button displays an animated spinner with "Mengunggah Dokumen...".
  - Clicking any element inside the form canvas during upload is intercepted and displays an informative notification.
  - Full TypeScript typecheck and test suites pass with zero errors.
- **Verification method:** Browser subagent walkthrough, manual verification, and type checking (`tsc --noEmit`).
- **Responsible role:** UI/UX Reviewer / Frontend Engineer
- **Status:** ✅ `completed`

---

#### BV-032
- **Task ID:** `BV-032`
- **Title:** Verification Flow V2 — Single ACID Submission & Honest Stepper Status
- **Objective:** Eliminate state disconnection bugs in the verification wizard by implementing additive schema persistence (representative position/email/nationality, outlet province/district, verification drafts, section reviews), a single ACID transaction submission action, and an honest stepper engine that highlights rejected sections in amber with "Perlu Perbaikan".
- **Context and rationale:** 
  - In previous versions, when an admin rejected specific fields or accounts (e.g. NIB or bank account), returning to the wizard showed all stepper icons as green checkmarks (`completed`), falsely reassuring the merchant.
  - Step 1 locked into a static summary card when a profile existed, with no avenue to edit rejected fields or re-upload legal documents.
  - Step 2 and Step 4 lost fields on reload because columns were missing from database tables and schema mappings.
  - Uploaded documents (KTP, NIB, NPWP, outlet photos) were not hydrated on reload, giving the impression that documents vanished.
  - Final submission triggered up to 5 uncoordinated sequential client calls, risking partial database state failures.
- **Expected changes:**
  - Database & Schemas:
    - Update `packages/validation/src/verification.schema.ts` with representative and region fields.
    - Update `apps/web/src/lib/db/schema.ts` adding columns to `businessProfiles` and `tenants`, and create `verificationDrafts` and `verificationSectionReviews` tables.
    - Run migration sync via `npm run db:sync -- --apply`.
  - Server Actions:
    - Create `saveVerificationDraftAction` and `submitVerificationApplicationAction` (single ACID transaction) in `apps/web/src/lib/actions/merchant-verification.ts`.
    - Update `getOutletVerificationOverview` to return `tenant.province`, `tenant.district`, `draft`, and `latestSubmission` with full documents and section reviews.
  - Frontend Components:
    - Update `upload-zone.tsx` to accept `reviewStatus` and `reviewNote`, rendering amber alert card on rejection and green badge on approval.
    - Update `wizard-stepper.tsx` with `stepStatuses` prop; renders amber exclamation circle (`AlertCircle`) with "Perlu Perbaikan" for `changes_requested`.
    - Update `wizard-shell.tsx` with complete hydration hierarchy (`draft` -> `latestSubmission` -> fallback), `uploadedDocs` document hydration, honest `stepStatuses` derivation, top "Perlu Perbaikan" banner with jump links, autosave draft on navigation, and unified submit call.
    - Update `step-1-business-profile.tsx` to allow editing when in repair mode or via "Ubah Data" toggle, passing review statuses to NIB and NPWP UploadZones.
    - Update `step-2-representative.tsx` to display alert banner and pass review status to KTP UploadZone.
    - Update `step-3-settlement.tsx` to render "Ditolak" badge and notes for rejected bank accounts, with "Perbaiki Rekening" button.
    - Update `step-4-outlet.tsx` to display alert banner and pass review status to storefront and cashier photo UploadZones.
- **Affected modules/files:**
  - `packages/validation/src/verification.schema.ts`
  - `apps/web/src/lib/db/schema.ts`
  - `apps/web/src/lib/actions/merchant-verification.ts`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/wizard/wizard-stepper.tsx`
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-007`, `BV-008`, `BV-009`, `BV-031`
- **Priority:** P0 (Critical)
- **Complexity:** XL
- **Acceptance criteria:**
  - Stepper reflects honest status: rejected sections display amber icon and "Perlu Perbaikan" badge; never green checks.
  - Step 1 is editable during repair mode or via toggle; NIB/NPWP re-upload is enabled.
  - Steps 2 and 4 retain all fields and documents across page reloads.
  - Rejection reasons and notes appear directly on affected fields and upload zones.
  - Final submission executes in 1 atomic database transaction with draft cleanup.
  - Typecheck and vitest tests pass cleanly.
- **Verification method:** Live browser subagent verification, TypeScript typecheck (`tsc --noEmit`), Vitest suite.
- **Responsible role:** Full-Stack Engineer / System Architect
- **Status:** ✅ `completed`

---

#### BV-033
- **Task ID:** `BV-033`
- **Title:** Granular Admin Review Console & Lifecycle Reopen
- **Objective:** Redesign the System Admin verification detail console into 4 sequential section review cards matching the merchant wizard order, with granular toggles, document inspections, automated decision rollups, and a lifecycle reopen action for permanently rejected submissions.
- **Context and rationale:** 
  - Admins previously reviewed applications using a disjointed layout that did not align with the 4 wizard steps.
  - Rejections lacked granular per-section categorization, forcing merchants to guess why their application was sent back.
  - Permanent rejection locked merchants completely without any operational recovery mechanism if the merchant cleared up a misunderstanding with Customer Support.
  - The admin queue table was an unstyled raw HTML table instead of Menuin's standard `AppTable`.
- **Expected changes:**
  - Admin Server Actions:
    - Update `apps/web/src/lib/actions/admin-verification.ts` with granular section reviews, per-document review updates, and `adminReopenVerificationAction`.
  - Admin Queue UI:
    - Refactor `admin-verification-queue-client.tsx` using Menuin standard `AppTable` component.
    - Add "Progres Bagian" chip column rendering status for Profil, PIC, Bank, and Gerai (`✓`, `✗`, `⏳`).
  - Admin Detail Console UI:
    - Redesign `admin-verification-detail-client.tsx` with 4 sequential section cards: Profil Usaha, Perwakilan Bisnis, Rekening Settlement, and Lokasi Gerai.
    - Add `[✓ Sesuai]` vs `[✗ Perlu Perbaikan]` toggle buttons, checklist quick-tags, and explicit review notes for each section.
    - Add automated decision rollup (`APPROVE` if all 4 sections approved, `REQUEST_CHANGES` if any section flagged).
    - Add "Buka Kembali Pengajuan" dialog for CS/Admins to reopen permanently rejected submissions.
- **Affected modules/files:**
  - `apps/web/src/lib/actions/admin-verification.ts`
  - `apps/web/src/app/system-admin/verification/admin-verification-queue-client.tsx`
  - `apps/web/src/app/system-admin/verification/[id]/admin-verification-detail-client.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-012`, `BV-013`, `BV-032`
- **Priority:** P1 (High)
- **Complexity:** L
- **Acceptance criteria:**
  - Admin review detail screen displays 4 sequential cards mirroring merchant wizard steps.
  - Reviewer can mark each section as Sesuai or Perlu Perbaikan with checklist tags and notes.
  - Admin queue uses Menuin `AppTable` with section progress indicators.
  - Permanent rejection can be reopened by Admin/CS via `adminReopenVerificationAction`.
  - Typecheck and vitest test suites pass with 0 errors.
#### BV-034
- **Task ID:** `BV-034`
- **Title:** Clean Stepper, Inline Alert Tooltips & Responsive Update Feedback
- **Objective:** Streamline the revision UX by removing redundant badges from the stepper progress bar, replacing prominent under-field warning boxes with inline alert icons that reveal notes on hover, and providing immediate feedback (`Data Baru Diperbarui` badge & dynamic step completion) upon uploading or editing new data.
- **Context and rationale:** Users felt overwhelmed by repeated "Perlu Perbaikan" badges in the sidebar when the colored status icon was already sufficient, and by large yellow boxes taking up vertical screen real estate. Furthermore, the absence of real-time state feedback on new inputs left merchants uncertain whether replacements were accepted.
- **Expected changes:**
  - `wizard-stepper.tsx`:
    - Remove textual `Perlu Perbaikan` badge from sidebar header row (`{finishedCount} dari 5 selesai` is consistently shown).
    - Remove `Perlu Perbaikan` text badges next to step titles; keep the amber circle with `AlertCircle` icon as the clean indicator.
  - `upload-zone.tsx`:
    - Remove large yellow under-field card (`Catatan Perbaikan: ...`).
    - Remove `Perlu Diunggah Ulang` text badge from file card.
    - Add amber `AlertCircle` icon on the right side of the field label row and inside the file card.
    - Implement accessible floating tooltip on hover/focus displaying `Catatan Perbaikan: {reviewNote}` without clipping (`z-50`).
    - Add `Data Baru Diperbarui` emerald pill badge when `isNewlyUpdated || localFile`.
  - `wizard-shell.tsx` & Steps 1-4:
    - Pass `isNewlyUpdated` and track `modifiedSections` on form changes and uploads.
    - Dynamically transition step status from `changes_requested` to `complete` (blue checkmark) once requested updates are fulfilled.
    - Render top success banner `Seluruh Data Perbaikan Telah Diperbarui` when all requested revisions have been resolved.
- **Affected modules/files:**
  - `apps/web/src/components/verification/wizard/wizard-stepper.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
- **Dependencies:** `BV-032`
- **Priority:** P1 (High)
- **Complexity:** S
- **Acceptance criteria:**
  - Sidebar stepper has no textual "Perlu Perbaikan" badges.
  - Field cards have no "Perlu Diunggah Ulang" badge and no large yellow note box underneath.
  - Amber alert icon on label and file card reveals note on hover cleanly.
  - Replacing file or modifying inputs shows "Data Baru Diperbarui" and updates step status to complete.
  - Zero typecheck errors and all unit/integration tests pass.
- **Verification method:** Live browser subagent verification, TypeScript typecheck (`tsc --noEmit`), Vitest suite.
- **Responsible role:** UI/UX Engineer
- **Status:** ✅ `completed`

---

#### BV-035
- **Task ID:** `BV-035`
- **Title:** Granular 4-Pillar Decoupling & Independent Rejection Status in Hub
- **Objective:** Eliminate false-positive `Perlu Revisi` status on Profil Usaha when only the Representative (PIC) is rejected, reading directly from `verificationSectionReviews`.
- **Context and rationale:** In `ProgressCard`, `repStatus` was aliased to `bpStatus`. Because `businessProfiles.verificationStatus` flips to `action_required` when either business profile or PIC is flagged, both pillars showed red revision alerts in Ringkasan. Decoupling them using `latestSubmission.sectionReviews` gives accurate, per-pillar feedback.
- **Expected changes:**
  - `progress-card.tsx` & `ringkasan-client.tsx`: Read each pillar status from `latestSubmission.sectionReviews` (fallback to entity status).
  - `reviewer-notes-card.tsx`: Only display notes for the exact rejected pillar (`Perwakilan Bisnis` instead of `Profil Legal Usaha` when only PIC is rejected).
- **Affected files:**
  - `apps/web/src/components/verification/hub/progress-card.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/ringkasan-client.tsx`
  - `apps/web/src/components/verification/hub/reviewer-notes-card.tsx`
- **Dependencies:** `BV-032`, `BV-033`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-036
- **Task ID:** `BV-036`
- **Title:** Subsidebar Detail Pages Image Storage Sync & Signed URL Display
- **Objective:** Fix missing images and document previews across subsidebar detail pages (`/verification/business`, `/representative`, `/outlet`).
- **Context and rationale:** Subsidebar clients filtered for `submissionScope === 'BUSINESS_PROFILE'`, causing empty document arrays when submissions are created under unified scope `APPLICATION`. Furthermore, tenant outlet photos were not reliably populated from submission uploads.
- **Expected changes:**
  - `merchant-verification.ts`: Ensure `submitVerificationApplicationAction` persists `FOTO_TAMPAK_DEPAN` and `FOTO_KASIR` storage keys into `tenants.storefrontPhotoUrl` and `tenants.indoorPhotoUrl`.
  - `business-client.tsx`, `representative-client.tsx`, `outlet-client.tsx`: Read documents from `latestSubmission` regardless of scope and fetch signed URLs for inline image rendering and download.
- **Affected files:**
  - `apps/web/src/lib/actions/merchant-verification.ts`
  - `apps/web/src/app/outlet/[outletKey]/verification/business/business-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/representative/representative-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/outlet/outlet-client.tsx`
- **Dependencies:** `BV-005`, `BV-032`
- **Priority:** P1 (High)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-037
- **Task ID:** `BV-037`
- **Title:** Card-Level Verified Fill Checkmark & Alert Icon Indicators
- **Objective:** Add card header indicators aligned right with the form title: a green filled checkmark when data is verified, and an alert icon when data requires revision.
- **Context and rationale:** Merchants navigating detail pages via the subsidebar need immediate feedback at the section card level to see if that specific block of data has been approved or contains compliance issues.
- **Expected changes:**
  - `section-card.tsx`: Add `verificationStatus?: 'verified' | 'action_required' | 'under_review' | 'pending' | 'draft' | 'incomplete'` and `reviewNote?: string | null`.
  - Render filled green checkmark (`CheckCircle2` with emerald styling) when `verified`, and alert icon (`AlertCircle` with amber/rose styling) with tooltip when `action_required`.
  - Integrate across all subsidebar detail pages.
- **Affected files:**
  - `apps/web/src/components/verification/shared/section-card.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/business/business-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/representative/representative-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/settlement/settlement-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/outlet/outlet-client.tsx`
- **Dependencies:** `BV-035`
- **Priority:** P1 (High)
- **Complexity:** S
- **Status:** ✅ `completed`

---

#### BV-038
- **Task ID:** `BV-038`
- **Title:** Admin Manual Verification of Critical Form Text Fields
- **Objective:** Enable compliance reviewers to manually verify and flag critical text fields (NIB, NPWP, NIK, PIC name, address, etc.) in addition to document attachments.
- **Context and rationale:** Compliance checks require comparing text inputs against official registers. Admin reviewers must be able to mark individual text fields as `[Sesuai]` or `[Flag / Salah]`, saving flagged field names into `verificationSectionReviews.flaggedFields`.
- **Expected changes:**
  - `admin-verification-detail-client.tsx`: Add field-level verification toggles with visual states (green check for valid, red/amber alert for flagged).
  - Connect field flags into `sectionsState[sectionKey].flaggedFields`.
  - Highlight flagged text fields and prompt for revision note when flagged.
- **Affected files:**
  - `apps/web/src/app/system-admin/verification/[id]/admin-verification-detail-client.tsx`
- **Dependencies:** `BV-033`
- **Priority:** P1 (High)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-039
- **Task ID:** `BV-039`
- **Title:** Menuin UI/UX Standards: Typography (No Uppercase) & Standard Table
- **Objective:** Enforce Menuin UI/UX design system rules: eliminate all `uppercase` and `tracking-wider` styling, and standardize tables using `@/components/ui/table`.
- **Context and rationale:** All-caps text with wide letter-spacing reduces legibility and contradicts Menuin's clean, friendly design system. Raw HTML tables break visual consistency.
- **Expected changes:**
  - Replace raw HTML table in `settlement-client.tsx` with `@/components/ui/table`.
  - Remove `uppercase` and `tracking-wider` from `reviewer-notes-card.tsx`, `status-hero-card.tsx`, `pillar-card.tsx`, `progress-card.tsx`, and `section-card.tsx`.
- **Affected files:**
  - `apps/web/src/app/outlet/[outletKey]/verification/settlement/settlement-client.tsx`
  - `apps/web/src/components/verification/hub/reviewer-notes-card.tsx`
  - `apps/web/src/components/verification/hub/status-hero-card.tsx`
  - `apps/web/src/components/verification/hub/pillar-card.tsx`
  - `apps/web/src/components/verification/hub/progress-card.tsx`
  - `apps/web/src/components/verification/shared/section-card.tsx`
- **Dependencies:** `BV-023`
- **Priority:** P1 (High)
- **Complexity:** S
- **Status:** ✅ `completed`

---

#### BV-040
- **Task ID:** `BV-040`
- **Title:** Deterministic Latest Resolution & Explicit Submission Timestamps
- **Objective:** Fix sorting non-determinism in merchant hub query and guarantee explicit timestamps upon submission insert.
- **Context and rationale:** In `getOutletVerificationOverview`, sorting previously relied solely on `submittedAt DESC`. Because `submittedAt` was sometimes null or epoch 0, sorting was ambiguous, causing the hub to read Pengajuan Ke-1 where Rekening was rejected rather than Pengajuan Ke-2 where Rekening was approved.
- **Expected changes:**
  - In `apps/web/src/lib/actions/merchant-verification.ts`:
    - Sort submissions deterministically: `attemptNumber DESC, submittedAt DESC, createdAt DESC`.
    - Set `submittedAt: new Date()` explicitly on insert in `submitVerificationApplicationAction`.
- **Affected files:**
  - `apps/web/src/lib/actions/merchant-verification.ts`
- **Dependencies:** `BV-032`
- **Priority:** P0 (Critical)
- **Complexity:** S
- **Status:** ✅ `completed`

---

#### BV-041
- **Task ID:** `BV-041`
- **Title:** Entity-Centric KYC Queue (1 Outlet = 1 Row) & Attempt Counters
- **Objective:** Present exactly one row per merchant entity in the admin verification queue, eliminating duplicate historical rows and showing attempt revision indicators.
- **Context and rationale:** Showing multiple historical rows for each revision attempt cluttered the queue. Deduplicating by `tenantId` (or `businessProfileId`) guarantees compliance reviewers see a clean case management inbox.
- **Expected changes:**
  - In `apps/web/src/lib/actions/admin-verification.ts`:
    - Order submissions by `attemptNumber DESC, submittedAt DESC, createdAt DESC`.
    - Apply Map-based deduplication per entity so exactly 1 latest row is returned.
    - Calculate queue tab counts based on unique merchant entities.
  - In `apps/web/src/app/system-admin/verification/admin-verification-queue-client.tsx`:
    - Render `Ke-{item.attemptNumber}` with a soft pastel `(Revisi)` badge when `attemptNumber > 1`.
    - Add timestamp fallback to `createdAt` or "Baru saja" to avoid 1970 date display.
    - Format status badges and chips borderless per Menuin UI SSOT.
- **Affected files:**
  - `apps/web/src/lib/actions/admin-verification.ts`
  - `apps/web/src/app/system-admin/verification/admin-verification-queue-client.tsx`
- **Dependencies:** `BV-012`, `BV-040`
- **Priority:** P1 (High)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-042
- **Task ID:** `BV-042`
- **Title:** Verification Lifecycle Locking, Immutability & Archive Navigation
- **Objective:** Implement lifecycle locking to prevent unilateral data modification and provide explicit archive banners for superseded submissions.
- **Context and rationale:** Submissions that have been superseded by a newer attempt, or are in `action_required` state waiting for merchant revision, or have been verified must be read-only to avoid race conditions.
- **Expected changes:**
  - In `apps/web/src/lib/actions/admin-verification.ts`:
    - Check for newer submissions and issued decisions in `getVerificationSubmissionDetail`, returning `isSuperseded, isDecisionIssued, newerSubmissionId, newerAttemptNumber`.
    - Add immutability guard in `submitVerificationDecisionAction` rejecting changes to superseded attempts.
  - In `apps/web/src/app/system-admin/verification/[id]/admin-verification-detail-client.tsx`:
    - Render top banner for superseded archives with a direct link to the newest attempt.
    - Render top banner when waiting for merchant revision.
    - Render read-only decision card in the right sidebar when `isFormLocked`.
    - Disable section status toggles, field flags, and document review buttons when locked.
- **Affected files:**
  - `apps/web/src/lib/actions/admin-verification.ts`
  - `apps/web/src/app/system-admin/verification/[id]/admin-verification-detail-client.tsx`
- **Dependencies:** `BV-013`, `BV-041`
- **Priority:** P0 (Critical)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-043
- **Task ID:** `BV-043`
- **Title:** Incremental Review & Inherited Section Approvals on Resubmissions
- **Objective:** Automatically carry over previously approved sections into newly submitted revision attempts so reviewers do not repeat review work.
- **Context and rationale:** If an admin already approved Profil Usaha, Rekening, and Gerai on attempt 1, and only rejected PIC KTP, resubmitting on attempt 2 should carry over the 3 approved sections as `APPROVED`.
- **Expected changes:**
  - In `apps/web/src/lib/actions/merchant-verification.ts`:
    - In `submitVerificationApplicationAction`, if `attemptNumber > 1`, inspect previous submission's section reviews.
    - Inherit any sections with status `APPROVED` into the new submission with note `(Disetujui pada pengajuan sebelumnya)`.
- **Affected files:**
  - `apps/web/src/lib/actions/merchant-verification.ts`
- **Dependencies:** `BV-032`, `BV-042`
- **Priority:** P1 (High)
- **Complexity:** M
- **Status:** ✅ `completed`

---

#### BV-044
- **Task ID:** `BV-044`
- **Title:** Elimination of Redundant Revision Alert Banner in Verification Wizard
- **Objective:** Remove the yellow alert banner ("Pengajuan Anda Memerlukan Perbaikan") from the verification wizard form canvas, relying solely on the sidebar progress stepper and in-place field review notes.
- **Context and rationale:** The multi-step wizard stepper in the left sidebar already displays the exact status for every step (amber icons for `changes_requested`, completed count, and direct click navigation). Each step's form also contains inline reviewer note cards for rejected items. Displaying a large alert banner across the top of the form canvas was redundant and created visual clutter.
- **Expected changes:**
  - In `apps/web/src/components/verification/wizard/wizard-shell.tsx`:
    - Remove the alert banner markup (`hasAnyChangesRequested ? (...) : ...`).
    - Remove unused state `hasAnyChangesRequested` and icon imports (`AlertCircle`, `CheckCircle2`).
- **Affected files:**
  - `apps/web/src/components/verification/wizard/wizard-shell.tsx`
- **Dependencies:** `BV-029`, `BV-043`
- **Priority:** P2 (Medium)
- **Complexity:** XS
- **Status:** ✅ `completed`

---

#### BV-045
- **Task ID:** `BV-045`
- **Title:** Elimination of Step-Level Revision Alert Cards across Verification Wizard Steps
- **Objective:** Remove the duplicate revision alert cards ("Perlu Perbaikan [Nama Seksi]") from each step component (Step 1 Profil Usaha, Step 2 Perwakilan Bisnis, Step 3 Rekening Settlement, Step 4 Lokasi Gerai) in the verification wizard.
- **Context and rationale:** Having alert cards repeated at the top of each individual step form created visual redundancy with the left sidebar stepper (`WizardStepper`), which already serves as the definitive status indicator with step badges and warning icons. Removing them ensures the form starts directly with input fields.
- **Expected changes:**
  - In `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`: Remove `isSectionRepaired ? (...) : isNeedsChanges && (...)` alert card and unused icons.
  - In `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`: Remove alert card and unused icons.
  - In `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`: Remove alert card and unused icons.
  - In `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`: Remove alert card and unused icons.
- **Affected files:**
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-2-representative.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
- **Status:** ✅ `completed`

---

#### BV-046
- **Task ID:** `BV-046`
- **Title:** Single Alert Policy for Input Fields & Removal of Inner Card Alert in UploadZone
- **Objective:** Eliminate duplicate alert notices on document upload fields by removing the internal square alert box button inside the card/dropzone while keeping the single alert icon at the top beside the field label.
- **Context and rationale:** In `UploadZone`, rejected documents previously triggered two separate alert indicators: one at the top right of the label and a second amber square button (`w-8 h-8 bg-amber-50 border border-amber-200`) inside the file card right next to the "Ganti" button. This created visual redundancy and cluttered the action buttons row.
- **Expected changes:**
  - In `apps/web/src/components/verification/shared/upload-zone.tsx`:
    - Remove the inner alert button (`group/cardalert` and `group/emptyalert`) from inside the file card and empty dropzone.
    - Preserve the primary alert icon beside the field label (`group/fieldalert`) with its informative hover tooltip.
- **Affected files:**
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
- **Dependencies:** `BV-045`
- **Priority:** P2 (Medium)
- **Complexity:** XS
- **Status:** ✅ `completed`

---

#### BV-047
- **Task ID:** `BV-047`
- **Title:** Menuin Status Badge Standardization (px-2 py-0.5 rounded-xl, Borderless, Iconless)
- **Objective:** Standardize all colored status badges, pills, and chips across the business verification process to use `px-2 py-0.5 rounded-xl`, zero borders (`border-none`), and zero internal icons.
- **Context and rationale:** Following user guidance and reference design on the `Kartu Tanda Penduduk` upload badge (`Data Baru Diperbarui`), badges across Menuin verification must follow a single, minimalist, and non-cluttered design standard. Overuse of internal icons (`CheckCircle2`, `AlertCircle`, `Clock`, `Star`, `Check`, `FileText`, emojis) and inconsistent borders (`rounded-full`, `rounded-md`) looked busy.
- **Expected changes:**
  - `status-pill.tsx`: Base styling to `inline-flex items-center px-2 py-0.5 rounded-xl text-[11px] font-medium transition-colors border-none`.
  - `upload-zone.tsx`: Standardize `isUpdated` and `reviewStatus === 'ACCEPTED'` badges to `px-2 py-0.5 rounded-xl` without icons.
  - `section-card.tsx`: Badges to `px-2 py-0.5 rounded-xl` borderless without icons.
  - `wizard-stepper.tsx`: `status === 'approved'` badge to `px-2 py-0.5 rounded-xl`.
  - `step-1-business-profile.tsx`: `entityType` and `Terverifikasi` badges to `px-2 py-0.5 rounded-xl`.
  - `step-3-settlement.tsx`: `Terverifikasi`, `Ditolak`, and `matchScore` badges to `px-2 py-0.5 rounded-xl border-none`.
  - `progress-card.tsx`: `{completedCount} dari 4` badge to `px-2 py-0.5 rounded-xl`.
  - `settlement-client.tsx`: `Utama` and `Outlet Ini` badges to `px-2 py-0.5 rounded-xl` without `Star` or `Check` icons.
  - `history-client.tsx`: `submissionScope` badge to `px-2 py-0.5 rounded-xl` without `FileText` icon.
  - `guideline-panel.tsx`: `STATUS: TERBIT` badge to `px-2 py-0.5 rounded-xl`.
  - `admin-verification-queue-client.tsx` & `admin-verification-detail-client.tsx`: Queue/detail status badges, section chips (removed emojis `⏳`, `✓`, `✗`), and notice badges to `px-2 py-0.5 rounded-xl border-none`.
- **Affected files:**
  - `apps/web/src/components/verification/shared/status-pill.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `apps/web/src/components/verification/shared/section-card.tsx`
  - `apps/web/src/components/verification/wizard/wizard-stepper.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/hub/progress-card.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/settlement/settlement-client.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/history/history-client.tsx`
  - `apps/web/src/components/verification/wizard/guideline-panel.tsx`
  - `apps/web/src/app/system-admin/verification/admin-verification-queue-client.tsx`
  - `apps/web/src/app/system-admin/verification/[id]/admin-verification-detail-client.tsx`
- **Dependencies:** `BV-046`
- **Priority:** P1 (High)
- **Complexity:** S
- **Status:** ✅ `completed`

---

#### BV-048
- **Task ID:** `BV-048`
- **Title:** Modern Button Animation & Underline Elimination
- **Objective:** Eliminate legacy `hover:underline` styles on action buttons and implement modern, tactile micro-animations (color inversion, active press scaling, and icon rotation/translations) matching Menuin's design language.
- **Context and rationale:** The user disliked the hover and click animations on the "Perbaiki Rekening" button, noting that `hover:underline` is outdated ("terlalu kuno"). Modern SaaS button design favors tactile active scaling (`active:scale-95`), smooth color inversion (`bg-blue-50 text-[#0e59f9]` to `hover:bg-[#0e59f9] hover:text-white`), subtle shadow elevations, and contextual icon micro-interactions (e.g. `group-hover:rotate-180` on refresh icon).
- **Expected changes:**
  - In `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`:
    - Upgrade "Perbaiki Rekening" button with `group inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[6px] text-xs font-semibold text-[#0e59f9] bg-blue-50 hover:bg-[#0e59f9] hover:text-white border border-blue-200/60 hover:border-[#0e59f9] transition-all duration-200 ease-out active:scale-95 shadow-2xs hover:shadow-xs`.
    - Add `group-hover:rotate-180 transition-transform duration-500 ease-out` on `<RefreshCw />`.
  - In `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`:
    - Upgrade "Ubah Data" toggle button with modern styling and `group-hover:scale-110` on `<Edit3 />`.
  - In `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`:
    - Upgrade "Gunakan Lokasi Saat Ini" button with modern styling and `group-hover:scale-110` on `<LocateFixed />`.
  - In `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`:
    - Upgrade all 4 "Ubah" jump-to-step buttons with modern styling.
  - In `apps/web/src/components/verification/hub/reviewer-notes-card.tsx`:
    - Upgrade "Perbaiki Data" action button with `group-hover:translate-x-0.5` on `<ArrowRight />`.
  - In `apps/web/src/components/verification/shared/upload-zone.tsx`:
    - Replace `hover:underline` on file name button with `hover:text-[#0e59f9]`.
- **Affected files:**
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-4-outlet.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `apps/web/src/components/verification/hub/reviewer-notes-card.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
- **Dependencies:** `BV-047`
- **Priority:** P1 (High)
- **Complexity:** XS
- **Status:** ✅ `completed`

---

#### BV-049
- **Task ID:** `BV-049`
- **Title:** Elimination of Verification Overview Alert Components & Addition of Circular Edit Button on Action-Required Cards
- **Objective:** Remove the prominent `<ReviewerNotesCard />` alert card from the verification hub overview page and add an interactive circular edit button (`rounded-full`) on pillar cards requiring revision (`action_required`), allowing one-click direct navigation to the corresponding onboarding form step.
- **Context and rationale:** Following user feedback, the top alert notice was removed to eliminate clutter. Instead, actionable edit affordances are embedded directly on the affected cards, giving users intuitive, focused pathways to complete required updates.
- **Expected changes:**
  - In `apps/web/src/app/outlet/[outletKey]/verification/ringkasan-client.tsx`:
    - Remove `<ReviewerNotesCard />` component and import.
    - Remove unused `reviewerNotes` array logic.
  - In `apps/web/src/components/verification/hub/pillar-card.tsx`:
    - Replace `<CircleAlert />` with circular edit button: `w-7 h-7 rounded-full bg-blue-50 text-[#0e59f9] border border-blue-200/70 hover:bg-[#0e59f9] hover:text-white active:scale-90`.
    - Handle `router.push(editHref || href)` with `e.stopPropagation()`.
  - In `apps/web/src/components/verification/hub/progress-card.tsx`:
    - Wire `editHref` for each step (`step=1` for Profil Usaha, `step=2` for Perwakilan Bisnis, `step=3` for Rekening Settlement, `step=4` for Lokasi Gerai).
- **Affected files:**
  - `apps/web/src/app/outlet/[outletKey]/verification/ringkasan-client.tsx`
  - `apps/web/src/components/verification/hub/pillar-card.tsx`
  - `apps/web/src/components/verification/hub/progress-card.tsx`
- **Dependencies:** `BV-048`
- **Priority:** P1 (High)
- **Complexity:** XS
- **Status:** ✅ `completed`

---

#### BV-050
- **Task ID:** `BV-050`
- **Title:** Refinement of PillarCard Dual-Indicator Layout & Elimination of "Tutup Formulir" Toggle
- **Objective:** Restore the `CircleAlert` status icon at the top right of `action_required` pillar cards, place the circular borderless edit button at the bottom right, and eliminate the confusing "Tutup Formulir" / "Ubah Data" toggle button from Step 1 of the onboarding wizard.
- **Context and rationale:** The user requested retaining the top-right alert icon as an immediate visual status indicator while positioning the edit button at the bottom-right without a border. The user also identified that the "Tutup Formulir" toggle button in Step 1 was non-essential and created confusion by collapsing legal data fields, directing its removal.
- **Expected changes:**
  - In `apps/web/src/components/verification/hub/pillar-card.tsx`:
    - Restore `<CircleAlert className="w-4 h-4 text-rose-500 flex-shrink-0" />` at top right for `action_required`.
    - Render circular edit button at bottom right: `w-7 h-7 rounded-full bg-blue-50 text-[#0e59f9] hover:bg-[#0e59f9] hover:text-white border-0 active:scale-90`.
  - In `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`:
    - Remove "Tutup Formulir" / "Ubah Data" toggle button.
    - Set `showForm = true` so legal data fields remain persistently visible.
- **Affected files:**
  - `apps/web/src/components/verification/hub/pillar-card.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-1-business-profile.tsx`
- **Dependencies:** `BV-049`
- **Priority:** P1 (High)
- **Complexity:** XS
- **Status:** ✅ `completed`

---

#### BV-051
- **Task ID:** `BV-051`
- **Title:** Complete Elimination of Uppercase & Tracking-Wider Typography Across Verification Domain
- **Objective:** Expunge all occurrences of CSS `uppercase`, `tracking-wider`, and `tracking-widest` from the verification domain typography, establishing natural sentence-case capitalization and standard letter spacing as the strict project standard.
- **Context and rationale:** The user reiterated that typography in Menuin must never use uppercase text transformation or wider letter tracking. Eyebrows (such as `PageHeader`), table headers, form labels, watermark numbers, and badges had remnants of uppercase and tracking-widest, producing an unnatural, loud look. Natural sentence-case (`text-xs font-semibold text-slate-500` or `text-[11px] font-medium text-slate-500`) aligns with Menuin's clean, enterprise design language.
- **Expected changes:**
  - In `apps/web/src/components/verification/shared/page-header.tsx`:
    - Update eyebrow from `text-[11px] font-medium text-slate-400 uppercase tracking-widest` to `text-xs font-semibold text-slate-500`.
  - In `apps/web/src/app/outlet/[outletKey]/verification/history/history-client.tsx`:
    - Update table header from `text-[11px] font-semibold text-slate-400 uppercase tracking-wider` to `text-xs font-semibold text-slate-500`.
  - In `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`:
    - Update all 18 review field labels across Cards 1, 2, 3, and 4 from `text-slate-400 block text-[10px] uppercase font-sans` to `text-slate-500 block text-[11px] font-medium`.
  - In `apps/web/src/components/verification/wizard/guideline-panel.tsx`:
    - Update "Panduan Pengisian" eyebrow from `text-[10px] font-semibold text-slate-400 uppercase` to `text-[11px] font-semibold text-slate-500`.
    - Remove `tracking-widest` from watermark span.
  - In `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`:
    - Remove `uppercase` from `bankAccountHolder` input.
  - In `apps/web/src/components/verification/hub/status-hero-card.tsx`:
    - Remove `tracking-wide` from status label.
  - In `apps/web/src/components/verification/shared/upload-zone.tsx`:
    - Remove `uppercase` from `PDF` file type badge.
  - In `docs/verify-bisnis/decision-log.md`:
    - Document Decision 43.
  - In `docs/verify-bisnis/task-register.md`:
    - Document Task BV-051.
- **Affected files:**
  - `apps/web/src/components/verification/shared/page-header.tsx`
  - `apps/web/src/app/outlet/[outletKey]/verification/history/history-client.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-5-review.tsx`
  - `apps/web/src/components/verification/wizard/guideline-panel.tsx`
  - `apps/web/src/components/verification/wizard/steps/step-3-settlement.tsx`
  - `apps/web/src/components/verification/hub/status-hero-card.tsx`
  - `apps/web/src/components/verification/shared/upload-zone.tsx`
  - `docs/verify-bisnis/decision-log.md`
  - `docs/verify-bisnis/task-register.md`
- **Dependencies:** `BV-050`
- **Priority:** P0 (Critical)
- **Complexity:** XS
- **Status:** ✅ `completed`






















