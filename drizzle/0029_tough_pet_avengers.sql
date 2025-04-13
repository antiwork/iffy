CREATE TABLE "slack_inboxes" (
	"id" text NOT NULL,
	"clerk_organization_id" text NOT NULL,
	"slack_team_id" text NOT NULL,
	"slack_team_name" text NOT NULL,
	"channel_id" text NOT NULL,
	"inbox_name" text NOT NULL,
	"bot_user_id" text NOT NULL,
	"inbox_access_token" text NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL,
	CONSTRAINT "slack_inboxes_pkey" PRIMARY KEY("clerk_organization_id","channel_id")
);
--> statement-breakpoint
CREATE INDEX "slack_inboxes_clerk_organization_id_idx" ON "slack_inboxes" USING btree ("clerk_organization_id" text_ops);--> statement-breakpoint
CREATE INDEX "slack_inboxes_channel_id_idx" ON "slack_inboxes" USING btree ("channel_id" text_ops);