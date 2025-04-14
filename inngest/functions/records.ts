import { inngest } from "@/inngest/client";
import db from "@/db";
import * as schema from "@/db/schema";
import { getFlaggedRecordsFromUser } from "@/services/users";
import { createUserAction } from "@/services/user-actions";
import { and, eq } from "drizzle-orm/expressions";
import { findOrCreateOrganization } from "@/services/organizations";

const updateUserAfterDeletion = inngest.createFunction(
  { id: "update-user-after-deletion" },
  { event: "record/deleted" },
  async ({ event, step }) => {
    const { organizationId, id } = event.data;

    const record = await step.run("fetch-record", async () => {
      const record = await db.query.records.findFirst({
        where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, id)),
        with: {
          user: true,
        },
      });
      if (!record) throw new Error(`Record not found: ${id}`);
      return record;
    });

    const user = record.user;
    if (!user) {
      return;
    }

    const flaggedRecords = await step.run("fetch-user-flagged-records", async () => {
      return await getFlaggedRecordsFromUser({
        organizationId,
        id: user.id,
      });
    });

    const organization = await step.run("fetch-organization", async () => {
      return await findOrCreateOrganization(organizationId);
    });

    if (flaggedRecords.length < organization.suspensionThreshold && user.actionStatus === "Suspended") {
      await step.run("create-user-action", async () => {
        return await createUserAction({
          organizationId,
          userId: user.id,
          status: "Compliant",
          via: "Automation All Compliant",
        });
      });
    }
  },
);

export default [updateUserAfterDeletion];
