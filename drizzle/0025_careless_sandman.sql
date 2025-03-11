CREATE TABLE "subscriptions" (
	"id" text PRIMARY KEY NOT NULL,
	"clerk_organization_id" text NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_clerk_organization_id_key" ON "subscriptions" USING btree ("clerk_organization_id" text_ops);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_stripe_customer_id_unique" UNIQUE("stripe_customer_id");