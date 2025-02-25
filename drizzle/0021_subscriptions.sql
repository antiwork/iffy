CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" text PRIMARY KEY NOT NULL,
  "organization_id" text NOT NULL REFERENCES "organizations"("id") ON DELETE CASCADE,
  "stripe_subscription_id" text NOT NULL,
  "plan" text NOT NULL,
  "status" text NOT NULL,
  "trial_end" timestamptz,
  "trial_moderations_remaining" integer DEFAULT 100,
  "created_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  "updated_at" timestamptz DEFAULT CURRENT_TIMESTAMP NOT NULL,
  CONSTRAINT "subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);

CREATE INDEX IF NOT EXISTS "subscriptions_organization_id_idx" ON "subscriptions" USING btree ("organization_id" text_ops);
CREATE INDEX IF NOT EXISTS "subscriptions_stripe_subscription_id_idx" ON "subscriptions" USING btree ("stripe_subscription_id" text_ops); 