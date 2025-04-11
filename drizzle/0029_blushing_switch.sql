CREATE TABLE "organization_slack_webhooks" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"clerk_organization_id" text NOT NULL,
	"channel" text NOT NULL,
	"channel_id" text NOT NULL,
	"configuration_url" text,
	"webhook_url" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slack_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slack_team_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slack_team_name" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "slack_access_token" text;--> statement-breakpoint
ALTER TABLE "organization_slack_webhooks" ADD CONSTRAINT "organization_slack_webhooks_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "organization_slack_webhooks" ADD CONSTRAINT "organization_slack_webhooks_org_id_fkey" FOREIGN KEY ("clerk_organization_id") REFERENCES "public"."organizations"("clerk_organization_id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "org_slack_webhooks_org_channel_id_idx" ON "organization_slack_webhooks" USING btree ("clerk_organization_id" text_ops,"channel_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slack_team_id_key" ON "organizations" USING btree ("slack_team_id" text_ops);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_slack_team_id_unique" UNIQUE("slack_team_id");