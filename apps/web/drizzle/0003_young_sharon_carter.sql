ALTER TABLE "audit_logs" ADD COLUMN "account_id" uuid;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "entity_type" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD COLUMN "entity_id" text;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "one_active_sub_idx" ON "subscriptions" USING btree ("tenant_id") WHERE "subscriptions"."status" = 'ACTIVE';