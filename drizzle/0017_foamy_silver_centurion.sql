ALTER TYPE "public"."RecordUserActionStatus" RENAME TO "UserActionStatus";--> statement-breakpoint
ALTER TABLE "record_user_actions" RENAME TO "user_actions";--> statement-breakpoint
ALTER TABLE "record_users" RENAME TO "users";--> statement-breakpoint
ALTER TABLE "appeals" RENAME COLUMN "record_user_action_id" TO "user_action_id";--> statement-breakpoint
ALTER TABLE "messages" RENAME COLUMN "record_user_action_id" TO "user_action_id";--> statement-breakpoint
ALTER TABLE "user_actions" RENAME COLUMN "record_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "record_user_id" TO "user_id";--> statement-breakpoint
ALTER TABLE "appeals" DROP CONSTRAINT "appeals_record_user_action_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "record_users_client_id_unique";--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "record_users_sort_unique";--> statement-breakpoint
ALTER TABLE "appeals" DROP CONSTRAINT "appeals_record_user_action_id_fkey";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_record_user_action_id_fkey";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_from_id_fkey";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_to_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_actions" DROP CONSTRAINT "record_user_actions_record_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "records" DROP CONSTRAINT "records_record_user_id_fkey";
--> statement-breakpoint
DROP INDEX IF EXISTS "appeals_record_user_action_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "appeals_record_user_action_id_key";--> statement-breakpoint
DROP INDEX IF EXISTS "record_user_actions_record_user_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "record_users_clerk_organization_id_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "record_users_client_id_key";--> statement-breakpoint
DROP INDEX IF EXISTS "record_users_sort_key";--> statement-breakpoint
DROP INDEX IF EXISTS "records_record_user_id_idx";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_action_id_fkey" FOREIGN KEY ("user_action_id") REFERENCES "public"."user_actions"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_user_action_id_fkey" FOREIGN KEY ("user_action_id") REFERENCES "public"."user_actions"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "messages" ADD CONSTRAINT "messages_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "records" ADD CONSTRAINT "records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "appeals_user_action_id_idx" ON "appeals" USING btree ("user_action_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "appeals_user_action_id_key" ON "appeals" USING btree ("user_action_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "user_actions_user_id_idx" ON "user_actions" USING btree ("user_id" text_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "users_clerk_organization_id_idx" ON "users" USING btree ("clerk_organization_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_client_id_key" ON "users" USING btree ("client_id" text_ops);--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_sort_key" ON "users" USING btree ("sort" int4_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "records_user_id_idx" ON "records" USING btree ("user_id" text_ops);--> statement-breakpoint
ALTER TABLE "appeals" ADD CONSTRAINT "appeals_user_action_id_unique" UNIQUE("user_action_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_client_id_unique" UNIQUE("client_id");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_sort_unique" UNIQUE("sort");