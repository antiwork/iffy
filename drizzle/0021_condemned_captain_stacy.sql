ALTER TABLE "user_actions" ADD COLUMN "via_record_id" text;--> statement-breakpoint
ALTER TABLE "user_actions" ADD COLUMN "via_appeal_id" text;--> statement-breakpoint
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_via_record_id_records_id_fk" FOREIGN KEY ("via_record_id") REFERENCES "public"."records"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_via_appeal_id_appeals_id_fk" FOREIGN KEY ("via_appeal_id") REFERENCES "public"."appeals"("id") ON DELETE set null ON UPDATE cascade;