-- Migration: Business Verification & Multi-Business Outlets Hierarchy (1:N:M)
-- Tasks: BV-003, BV-004
-- Safe, additive, idempotent migration.

-- 1. Business Profiles table
CREATE TABLE IF NOT EXISTS business_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name text NOT NULL,
  entity_type text NOT NULL, -- 'INDIVIDUAL' | 'PT' | 'CV' | 'YAYASAN' | 'KOPERASI'
  tax_id text,
  business_license_number text,
  responsible_person_name text NOT NULL,
  responsible_person_nik text NOT NULL,
  responsible_person_contact text NOT NULL,
  bank_name text NOT NULL,
  bank_account_number text NOT NULL,
  bank_account_holder text NOT NULL,
  verification_status text NOT NULL DEFAULT 'not_started',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure backwards compatibility if legacy columns exist from prior prototypes
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'business_name') THEN
    ALTER TABLE business_profiles ALTER COLUMN business_name DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'business_category') THEN
    ALTER TABLE business_profiles ALTER COLUMN business_category DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'business_type') THEN
    ALTER TABLE business_profiles ALTER COLUMN business_type DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'business_profiles' AND column_name = 'address') THEN
    ALTER TABLE business_profiles ALTER COLUMN address DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_audit_logs' AND column_name = 'submission_id') THEN
    ALTER TABLE verification_audit_logs ALTER COLUMN submission_id DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'verification_submissions' AND column_name = 'tenant_id') THEN
    ALTER TABLE verification_submissions ALTER COLUMN tenant_id DROP NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS business_profiles_account_idx
  ON business_profiles(account_id);

CREATE INDEX IF NOT EXISTS business_profiles_status_idx
  ON business_profiles(verification_status);

-- 2. Settlement Accounts table (Pillar 2: Rekening Settlement Decoupled)
CREATE TABLE IF NOT EXISTS settlement_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  bank_account_number text NOT NULL,
  bank_account_number_masked text NOT NULL,
  bank_account_holder text NOT NULL,
  proof_document_key text,
  verification_method text NOT NULL DEFAULT 'MANUAL_REVIEW',
  verification_status text NOT NULL DEFAULT 'pending',
  name_match_score integer,
  verification_notes text,
  is_default boolean NOT NULL DEFAULT false,
  doku_beneficiary_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS settlement_accounts_profile_idx ON settlement_accounts(business_profile_id);
CREATE INDEX IF NOT EXISTS settlement_accounts_status_idx ON settlement_accounts(verification_status);

-- 3. Alter tenants table to support Business Profile, Settlement Account, and Outlet Compliance
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS business_profile_id uuid REFERENCES business_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS settlement_account_id uuid REFERENCES settlement_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS postal_code text,
  ADD COLUMN IF NOT EXISTS latitude decimal(10, 8),
  ADD COLUMN IF NOT EXISTS longitude decimal(11, 8),
  ADD COLUMN IF NOT EXISTS storefront_photo_url text,
  ADD COLUMN IF NOT EXISTS indoor_photo_url text,
  ADD COLUMN IF NOT EXISTS outlet_compliance_status text NOT NULL DEFAULT 'incomplete';

CREATE INDEX IF NOT EXISTS tenants_business_profile_idx
  ON tenants(business_profile_id);

CREATE INDEX IF NOT EXISTS tenants_settlement_account_idx
  ON tenants(settlement_account_id);

CREATE INDEX IF NOT EXISTS tenants_outlet_compliance_idx
  ON tenants(outlet_compliance_status);

-- 3. Verification Submissions table
CREATE TABLE IF NOT EXISTS verification_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  submission_scope text NOT NULL, -- 'BUSINESS_PROFILE' | 'OUTLET'
  attempt_number integer NOT NULL DEFAULT 1,
  status text NOT NULL, -- 'submitted' | 'under_review' | 'action_required' | 'verified' | 'rejected'
  submission_snapshot jsonb NOT NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES accounts(id) ON DELETE SET NULL,
  decision_reason text,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_submissions_profile_idx
  ON verification_submissions(business_profile_id, status);

CREATE INDEX IF NOT EXISTS verification_submissions_tenant_idx
  ON verification_submissions(tenant_id);

-- 4. Verification Documents table
CREATE TABLE IF NOT EXISTS verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id uuid NOT NULL REFERENCES verification_submissions(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  document_scope text NOT NULL, -- 'BUSINESS_PROFILE' | 'OUTLET'
  document_type text NOT NULL, -- 'KTP', 'NPWP', 'NIB', 'AKTA', 'BUKU_TABUNGAN', 'FOTO_TAMPAK_DEPAN', etc.
  storage_key text NOT NULL,
  file_name text NOT NULL,
  file_size_bytes integer NOT NULL,
  mime_type text NOT NULL,
  review_status text NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'ACCEPTED', 'REJECTED'
  review_note text,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS verification_documents_submission_idx
  ON verification_documents(submission_id, review_status);

CREATE INDEX IF NOT EXISTS verification_documents_tenant_idx
  ON verification_documents(tenant_id);

-- 5. Provider Onboardings table (DOKU Sub-Account mapping)
CREATE TABLE IF NOT EXISTS provider_onboardings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'DOKU',
  provider_reference text, -- SAC-xxxx
  provider_status text NOT NULL DEFAULT 'NOT_PROVISIONED',
  idempotency_key text,
  last_synced_at timestamptz,
  last_error_code text,
  last_error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS provider_onboardings_provider_tenant_idx
  ON provider_onboardings(provider, tenant_id);

CREATE INDEX IF NOT EXISTS provider_onboardings_profile_idx
  ON provider_onboardings(business_profile_id);

-- 6. Verification Audit Logs table
CREATE TABLE IF NOT EXISTS verification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_profile_id uuid NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  tenant_id uuid REFERENCES tenants(id) ON DELETE SET NULL,
  actor_id uuid REFERENCES accounts(id) ON DELETE SET NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  previous_status text,
  new_status text,
  reason text,
  ip_address text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS verification_audit_logs_profile_idx
  ON verification_audit_logs(business_profile_id, created_at);

CREATE INDEX IF NOT EXISTS verification_audit_logs_tenant_idx
  ON verification_audit_logs(tenant_id);
