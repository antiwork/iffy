import { inngest } from "@/inngest/client";
import db from "@/db";
import * as schema from "@/db/schema";
import { getFlaggedRecordsFromUserRecord } from "@/services/user-records";
import { createUserAction } from "@/services/user-actions";
import { and, eq } from "drizzle-orm/expressions";
import { findOrCreateOrganization } from "@/services/organizations";

const updateUserRecordAfterDeletion = inngest.createFunction(
  { id: "update-user-record-after-deletion" },
  { event: "record/deleted" },
  async ({ event, step }) => {
    const { organizationId, id } = event.data;

    const record = await step.run("fetch-record", async () => {
      const record = await db.query.records.findFirst({
        where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, id)),
        with: {
          userRecord: true,
        },
      });
      if (!record) throw new Error(`Record not found: ${id}`);
      return record;
    });

    const userRecord = record.userRecord;
    if (!userRecord) {
      return;
    }

    const flaggedRecords = await step.run("fetch-user-flagged-records", async () => {
      return await getFlaggedRecordsFromUserRecord({
        organizationId,
        id: userRecord.id,
      });
    });

    const organization = await step.run("fetch-organization", async () => {
      return await findOrCreateOrganization({ id: organizationId });
    });

    if (flaggedRecords.length < organization.suspensionThreshold && userRecord.actionStatus === "Suspended") {
      await step.run("create-user-action", async () => {
        return await createUserAction({
          organizationId,
          userRecordId: userRecord.id,
          status: "Compliant",
          via: "Automation All Compliant",
        });
      });
    }
  },
);

export default [updateUserRecordAfterDeletion];
