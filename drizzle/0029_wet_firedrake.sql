ALTER TABLE "users" RENAME TO "user_records";--> statement-breakpoint
ALTER TABLE "records" RENAME COLUMN "user_id" TO "user_record_id";--> statement-breakpoint
ALTER TABLE "user_actions" RENAME COLUMN "user_id" TO "user_record_id";--> statement-breakpoint
ALTER TABLE "user_records" DROP CONSTRAINT "users_client_id_unique";--> statement-breakpoint
ALTER TABLE "user_records" DROP CONSTRAINT "users_sort_unique";--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_from_id_fkey";
--> statement-breakpoint
ALTER TABLE "messages" DROP CONSTRAINT "messages_to_id_fkey";
--> statement-breakpoint
ALTER TABLE "records" DROP CONSTRAINT "records_user_id_fkey";
--> statement-breakpoint
ALTER TABLE "user_actions" DROP CONSTRAINT "user_actions_user_id_fkey";
--> statement-breakpoint
DROP INDEX "records_user_id_idx";--> statement-breakpoint
DROP INDEX "user_actions_user_id_idx";--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_from_id_fkey" FOREIGN KEY ("from_id") REFERENCES "public"."user_records"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_to_id_fkey" FOREIGN KEY ("to_id") REFERENCES "public"."user_records"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "records" ADD CONSTRAINT "records_user_record_id_fkey" FOREIGN KEY ("user_record_id") REFERENCES "public"."user_records"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_user_record_id_fkey" FOREIGN KEY ("user_record_id") REFERENCES "public"."user_records"("id") ON DELETE restrict ON UPDATE cascade;--> statement-breakpoint
CREATE INDEX "records_user_record_id_idx" ON "records" USING btree ("user_record_id" text_ops);--> statement-breakpoint
CREATE INDEX "user_actions_user_record_id_idx" ON "user_actions" USING btree ("user_record_id" text_ops);--> statement-breakpoint
ALTER TABLE "user_records" ADD CONSTRAINT "user_records_client_id_unique" UNIQUE("client_id");--> statement-breakpoint
ALTER TABLE "user_records" ADD CONSTRAINT "user_records_sort_unique" UNIQUE("sort");