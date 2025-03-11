ALTER TABLE "organization_settings" RENAME TO "organizations";--> statement-breakpoint
ALTER TABLE "organizations" DROP CONSTRAINT "organization_settings_clerk_organization_id_unique";--> statement-breakpoint
DROP INDEX "organization_settings_clerk_organization_id_key";--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_clerk_organization_id_key" ON "organizations" USING btree ("clerk_organization_id" text_ops);--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_clerk_organization_id_unique" UNIQUE("clerk_organization_id");