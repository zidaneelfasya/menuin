ALTER TABLE "modifiers" ADD COLUMN "is_available" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "track_stock" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "products" ADD COLUMN "is_active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "order_prefix" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_header" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_footer" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_logo_url" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_show_logo" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_show_customer" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_show_cashier" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_show_table" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_show_notes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "receipt_custom_note" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_print_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_ticket_title" text DEFAULT 'TIKET DAPUR';--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_ticket_notes" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_show_customer" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_show_cashier" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_show_table" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_show_notes" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "kitchen_auto_cut" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "void_reason" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "voided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "voided_by_membership_id" uuid;