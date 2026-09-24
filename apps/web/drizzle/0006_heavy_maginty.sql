ALTER TABLE "businesses" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "businesses" CASCADE;--> statement-breakpoint
ALTER TABLE "tenants" DROP CONSTRAINT "tenants_business_id_businesses_id_fk";
--> statement-breakpoint
ALTER TABLE "tenants" DROP COLUMN "business_id";