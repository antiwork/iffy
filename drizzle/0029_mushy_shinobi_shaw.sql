CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "end_users" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"client_id" text NOT NULL,
	"client_url" text,
	"stripe_account_id" text,
	"email" text,
	"name" text,
	"username" text,
	"protected" boolean DEFAULT false NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	"sort" serial NOT NULL,
	"action_status" "UserActionStatus",
	"action_status_created_at" timestamp (3),
	"flagged_records_count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "end_users_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "end_users_sort_unique" UNIQUE("sort")
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"email" text NOT NULL,
	"role" text,
	"status" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"inviter_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text NOT NULL,
	"role" text NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"active_organization_id" text,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."moderations_analytics_daily";--> statement-breakpoint
DROP MATERIALIZED VIEW "public"."moderations_analytics_hourly";--> statement-breakpoint
ALTER TABLE "api_keys" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "api_keys" RENAME COLUMN "clerk_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "appeal_actions" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "appeal_actions" RENAME COLUMN "clerk_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "appeals" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "email_templates" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "moderations" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "moderations" RENAME COLUMN "clerk_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "user_id" TO "end_user_id";--> statement-breakpoint
ALTER TABLE "rule_strategies" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "rules" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "rulesets" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "subscriptions" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "user_actions" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "user_actions" RENAME COLUMN "user_id" TO "end_user_id";--> statement-breakpoint
ALTER TABLE "user_actions" RENAME COLUMN "clerk_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "webhook_endpoints" RENAME COLUMN "clerk_organization_id" TO "organization_id";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organizations_clerk_organization_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_client_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_sort_unique";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_from_id_fkey";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_to_id_fkey";
--> statement-breakpoint
ALTER TABLE "records" DROP CONSTRAINT "records_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_actions" DROP CONSTRAINT "user_actions_user_id_fkey";
--> statement-breakpoint
DROP INDEX "appeals_clerk_organization_id_idx";--> statement-breakpoint
DROP INDEX "organizations_clerk_organization_id_key";--> statement-breakpoint
DROP INDEX "records_clerk_organization_id_idx";--> statement-breakpoint
DROP INDEX "records_user_id_idx";--> statement-breakpoint
DROP INDEX "subscriptions_clerk_organization_id_key";--> statement-breakpoint
DROP INDEX "users_clerk_organization_id_idx";--> statement-breakpoint
DROP INDEX "users_client_id_key";--> statement-breakpoint
DROP INDEX "users_sort_key";--> statement-breakpoint
DROP INDEX "moderations_org_status_idx";--> statement-breakpoint
ALTER TABLE "user_actions" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "name" text NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slug" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "logo" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "metadata" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "email_verified" boolean NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "image" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_id_users_id_fk" FOREIGN KEY ("inviter_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "end_users_organization_id_idx" ON "end_users" USING btree ("organization_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "end_users_client_id_key" ON "end_users" USING btree ("client_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "end_users_sort_key" ON "end_users" USING btree ("sort" int4_ops);--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."end_users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."end_users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_end_user_id_fkey" FOREIGN KEY ("end_user_id") REFERENCES "public"."end_users"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_actions" ADD CONSTRAINT "end_user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."end_users"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "appeals_organization_id_idx" ON "appeals" USING btree ("organization_id" text_ops);--> statement-breakpoint
CREATE INDEX "records_organization_id_idx" ON "records" USING btree ("organization_id" text_ops);--> statement-breakpoint
CREATE INDEX "records_end_user_id_idx" ON "records" USING btree ("end_user_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_organization_id_key" ON "subscriptions" USING btree ("organization_id" text_ops);--> statement-breakpoint
CREATE INDEX "moderations_org_status_idx" ON "moderations" USING btree ("organization_id" text_ops,"status");--> statement-breakpoint
ALTER TABLE "organizations" DROP COLUMN "clerk_organization_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "clerk_organization_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "client_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "client_url";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "stripe_account_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "protected";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "metadata";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "sort";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "action_status";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "action_status_created_at";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "flagged_records_count";--> statement-breakpoint
ALTER TABLE "email_templates" DROP CONSTRAINT "email_templates_pkey";
--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_pkey" PRIMARY KEY("organization_id","type");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slug_unique" UNIQUE("slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_email_unique" UNIQUE("email");--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."moderations_analytics_daily" AS (
  WITH time_filtered_moderations AS (
    SELECT 
      "moderations"."id" as moderation_id,
      "moderations"."organization_id" as organization_id,
      "moderations"."created_at" as created_at,
      "moderations"."status" as status
    FROM "moderations"
    WHERE "moderations"."created_at" AT TIME ZONE 'UTC' >= date_trunc('day', now() AT TIME ZONE 'UTC') - INTERVAL '29 days'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.organization_id,
      m.created_at,
      m.status,
      "moderations_to_rules"."rule_id" as rule_id,
      COALESCE("presets"."name", "rules"."name") as rule_name,
      COALESCE("presets"."description", "rules"."description") as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN "moderations_to_rules" ON m.moderation_id = "moderations_to_rules"."moderation_id"
    LEFT JOIN "rules" ON "moderations_to_rules"."rule_id" = "rules"."id"
    LEFT JOIN "presets" ON "rules"."preset_id" = "presets"."id"
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('day', m.created_at AT TIME ZONE 'UTC') AS time,
      m.organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.organization_id, rule_id
  )
  SELECT
    date_trunc('day', m.created_at AT TIME ZONE 'UTC') as time,
    m.organization_id as organization_id,
    COUNT(*)::int AS moderations,
    COUNT(*) FILTER (WHERE m.status = 'Flagged')::int AS flagged,
    COALESCE(
      jsonb_object_agg(
        rc.rule_id,
        jsonb_build_object(
          'count', rc.rule_count,
          'name', rc.rule_name,
          'description', rc.rule_description
        )
      ) FILTER (WHERE rc.rule_id IS NOT NULL),
      '{}'::jsonb
    ) AS flagged_by_rule
  FROM time_filtered_moderations m
  LEFT JOIN rule_counts rc ON 
    date_trunc('day', m.created_at AT TIME ZONE 'UTC') = rc.time AND 
    m.organization_id = rc.organization_id
  GROUP BY date_trunc('day', m.created_at AT TIME ZONE 'UTC'), m.organization_id
);--> statement-breakpoint
CREATE MATERIALIZED VIEW "public"."moderations_analytics_hourly" AS (
  WITH time_filtered_moderations AS (
    SELECT 
      "moderations"."id" as moderation_id,
      "moderations"."organization_id" as organization_id,
      "moderations"."created_at" as created_at,
      "moderations"."status" as status
    FROM "moderations"
    WHERE "moderations"."created_at" AT TIME ZONE 'UTC' >= date_trunc('hour', now() AT TIME ZONE 'UTC') - INTERVAL '23 hours'
  ),
  flagged_moderations AS (
    SELECT 
      m.moderation_id,
      m.organization_id,
      m.created_at,
      m.status,
      "moderations_to_rules"."rule_id" as rule_id,
      COALESCE("presets"."name", "rules"."name") as rule_name,
      COALESCE("presets"."description", "rules"."description") as rule_description
    FROM time_filtered_moderations m
    LEFT JOIN "moderations_to_rules" ON m.moderation_id = "moderations_to_rules"."moderation_id"
    LEFT JOIN "rules" ON "moderations_to_rules"."rule_id" = "rules"."id"
    LEFT JOIN "presets" ON "rules"."preset_id" = "presets"."id"
    WHERE m.status = 'Flagged'
  ),
  rule_counts AS (
    SELECT
      date_trunc('hour', m.created_at AT TIME ZONE 'UTC') AS time,
      m.organization_id,
      rule_id,
      COUNT(*) as rule_count,
      MAX(rule_name) as rule_name,
      MAX(rule_description) as rule_description
    FROM flagged_moderations m
    WHERE rule_id IS NOT NULL
    GROUP BY time, m.organization_id, rule_id
  )
  SELECT
    date_trunc('hour', m.created_at AT TIME ZONE 'UTC') as time,
    m.organization_id as organization_id,
    COUNT(*)::int AS moderations,
    COUNT(*) FILTER (WHERE m.status = 'Flagged')::int AS flagged,
    COALESCE(
      jsonb_object_agg(
        rc.rule_id,
        jsonb_build_object(
          'count', rc.rule_count,
          'name', rc.rule_name,
          'description', rc.rule_description
        )
      ) FILTER (WHERE rc.rule_id IS NOT NULL),
      '{}'::jsonb
    ) AS flagged_by_rule
  FROM time_filtered_moderations m
  LEFT JOIN rule_counts rc ON 
    date_trunc('hour', m.created_at AT TIME ZONE 'UTC') = rc.time AND 
    m.organization_id = rc.organization_id
  GROUP BY date_trunc('hour', m.created_at AT TIME ZONE 'UTC'), m.organization_id
);
