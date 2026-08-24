CREATE TYPE "public"."role" AS ENUM('CASHIER', 'ADMIN', 'SUPERADMIN', 'SYSTEM_ADMIN');--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "dashboard_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'CASHIER'::"public"."role";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."role" USING "role"::"public"."role";