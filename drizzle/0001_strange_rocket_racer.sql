CREATE TABLE "operating_hours" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"day_of_week" integer NOT NULL,
	"open_time" text DEFAULT '09:00' NOT NULL,
	"close_time" text DEFAULT '22:00' NOT NULL,
	"is_closed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"transaction_id" uuid NOT NULL,
	"provider_transaction_id" text,
	"provider" text DEFAULT 'MIDTRANS' NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"status" text DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tables" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"name" text NOT NULL,
	"qr_code_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "categories" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_available_online" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "display_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "storefront_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "store_description" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "store_logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "store_banner_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "primary_color" text DEFAULT '#2563EB';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "dine_in_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "take_away_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "delivery_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "customer_name_required" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "customer_phone_required" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "order_process_type" text DEFAULT 'MANUAL' NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "midtrans_server_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "midtrans_client_key" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "midtrans_environment" text DEFAULT 'sandbox';--> statement-breakpoint
ALTER TABLE "transaction_items" ADD COLUMN "is_completed" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "source" text DEFAULT 'POS' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "order_type" text DEFAULT 'DINE_IN' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "customer_name" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "customer_phone" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "table_number" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "public_token" uuid DEFAULT gen_random_uuid();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "order_number" text;--> statement-breakpoint
ALTER TABLE "operating_hours" ADD CONSTRAINT "operating_hours_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_transaction_id_transactions_id_fk" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tables" ADD CONSTRAINT "tables_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_public_token_unique" UNIQUE("public_token");--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_number_unique" UNIQUE("order_number");