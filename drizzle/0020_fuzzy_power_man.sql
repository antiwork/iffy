CREATE TABLE IF NOT EXISTS "organizations" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_org_id" text NOT NULL,
	"stripe_customer_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_clerk_org_id_unique" UNIQUE("clerk_org_id")
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_clerk_org_id_idx" ON "organizations" USING btree ("clerk_org_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "organizations_stripe_customer_id_idx" ON "organizations" USING btree ("stripe_customer_id" text_ops);