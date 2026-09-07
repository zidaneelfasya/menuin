DO $$ BEGIN
 CREATE TYPE "public"."invitation_status" AS ENUM('PENDING', 'ACCEPTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 CREATE TYPE "public"."tenant_role" AS ENUM('OWNER', 'SUPERVISOR', 'STAFF');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"user_id" uuid,
	"action" text NOT NULL,
	"details" json,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" "tenant_role" DEFAULT 'STAFF' NOT NULL,
	"status" "invitation_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"ip_address" text,
	"action" text NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"lock_until" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "tenant_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "tenant_role" DEFAULT 'STAFF' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- ADD NEW COLUMNS
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "pin_hash" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp;

-- MIGRATE DATA FROM USERS TO TENANT_MEMBERS (Insert ONLY if not exists)
INSERT INTO "tenant_members" (tenant_id, user_id, role)
SELECT tenant_id, id, 'OWNER' FROM "users" WHERE tenant_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- NOW DROP COLUMNS FROM USERS
ALTER TABLE "users" DROP COLUMN IF EXISTS "tenant_id" CASCADE;
ALTER TABLE "users" DROP COLUMN IF EXISTS "role" CASCADE;

-- ADD FOREIGN KEYS
DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "invitations" ADD CONSTRAINT "invitations_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
 ALTER TABLE "tenant_members" ADD CONSTRAINT "tenant_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_user_idx" ON "tenant_members" USING btree ("tenant_id","user_id");
