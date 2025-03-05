-- Add viaRecordId and viaAppealId columns to userActions table
ALTER TABLE "user_actions" ADD COLUMN "via_record_id" TEXT;
ALTER TABLE "user_actions" ADD COLUMN "via_appeal_id" TEXT;

-- Add foreign key constraints
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_via_record_id_fkey" FOREIGN KEY ("via_record_id") REFERENCES "records"("id") ON UPDATE CASCADE ON DELETE SET NULL;
ALTER TABLE "user_actions" ADD CONSTRAINT "user_actions_via_appeal_id_fkey" FOREIGN KEY ("via_appeal_id") REFERENCES "appeals"("id") ON UPDATE CASCADE ON DELETE SET NULL;
