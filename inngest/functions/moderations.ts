import { sendWebhook } from "@/services/webhook";
import { inngest } from "@/inngest/client";
import db from "@/db";
import { getFlaggedRecordsFromUserRecord } from "@/services/user-records";
import { updatePendingModeration } from "@/services/moderations";
import { createUserAction } from "@/services/user-actions";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import * as service from "@/services/moderations";
import { parseMetadata } from "@/services/metadata";
import { findOrCreateOrganization } from "@/services/organizations";
import { createMeterEvent } from "@/services/stripe/usage";

const moderate = inngest.createFunction(
  { id: "moderate" },
  { event: "moderation/moderated" },
  async ({ event, step }) => {
    const { clerkOrganizationId, moderationId, recordId } = event.data;

    const result = await step.run("moderate", async () => {
      return await service.moderate({ clerkOrganizationId, recordId });
    });

    return await step.run("update-moderation", async () => {
      return await updatePendingModeration({
        clerkOrganizationId,
        id: moderationId,
        ...result,
      });
    });
  },
);

const updateUserRecordAfterModeration = inngest.createFunction(
  { id: "update-user-record-after-moderation" },
  { event: "moderation/status-changed" },
  async ({ event, step }) => {
    const { clerkOrganizationId, recordId, status } = event.data;

    const record = await step.run("fetch-record", async () => {
      const result = await db.query.records.findFirst({
        where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
        with: {
          userRecord: true,
        },
      });

      if (!result) {
        throw new Error(`Record not found: ${recordId}`);
      }
      return result;
    });

    const userRecord = record.userRecord;
    if (!userRecord) {
      return;
    }

    const flaggedRecords = await step.run("fetch-user-flagged-records", async () => {
      return await getFlaggedRecordsFromUserRecord({ clerkOrganizationId, id: userRecord.id });
    });

    const organization = await step.run("fetch-organization", async () => {
      return await findOrCreateOrganization(clerkOrganizationId);
    });

    let actionStatus: (typeof schema.userActionStatus.enumValues)[number] | undefined;
    let actionVia:
      | { via: "Automation Flagged Record"; viaRecordId: string }
      | { via: "Automation All Compliant" }
      | undefined;

    if (
      status === "Flagged" &&
      (!userRecord.actionStatus || userRecord.actionStatus === "Compliant") &&
      !userRecord.protected &&
      flaggedRecords.length >= organization.suspensionThreshold
    ) {
      actionStatus = "Suspended";
      actionVia = { via: "Automation Flagged Record", viaRecordId: recordId };
    }

    if (
      status === "Compliant" &&
      flaggedRecords.length < organization.suspensionThreshold &&
      userRecord.actionStatus === "Suspended"
    ) {
      actionStatus = "Compliant";
      actionVia = { via: "Automation All Compliant" };
    }

    if (!actionStatus || !actionVia) {
      return;
    }

    await step.run("create-user-action", async () => {
      return await createUserAction({
        clerkOrganizationId,
        userRecordId: userRecord.id,
        status: actionStatus,
        ...actionVia,
      });
    });
  },
);

const sendModerationWebhook = inngest.createFunction(
  { id: "send-moderation-webhook" },
  { event: "moderation/status-changed" },
  async ({ event, step }) => {
    const { clerkOrganizationId, id, status, recordId } = event.data;

    const moderation = await step.run("fetch-moderation", async () => {
      const result = await db.query.moderations.findFirst({
        where: and(eq(schema.moderations.clerkOrganizationId, clerkOrganizationId), eq(schema.moderations.id, id)),
      });
      if (!result) {
        throw new Error(`Moderation not found: ${id}`);
      }
      return result;
    });

    const record = await step.run("fetch-record", async () => {
      const result = await db.query.records.findFirst({
        where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.id, recordId)),
        with: {
          userRecord: true,
        },
      });

      if (!result) {
        throw new Error(`Record not found: ${recordId}`);
      }
      return result;
    });

    const userRecord = record.userRecord;

    await step.run("send-webhook", async () => {
      const webhook = await db.query.webhookEndpoints.findFirst({
        where: eq(schema.webhookEndpoints.clerkOrganizationId, clerkOrganizationId),
      });
      if (!webhook) throw new Error("No webhook found");

      const eventType = status === "Flagged" ? "record.flagged" : "record.compliant";
      await sendWebhook({
        id: webhook.id,
        event: eventType,
        data: {
          id: moderation.id,
          payload: {
            id: record.id,
            clientId: record.clientId,
            clientUrl: record.clientUrl ?? undefined,
            name: record.name,
            entity: record.entity,
            protected: record.protected,
            metadata: record.metadata ? parseMetadata(record.metadata) : undefined,
            status: moderation.status,
            statusUpdatedAt: new Date(moderation.updatedAt).getTime().toString(),
            statusUpdatedVia: moderation.via,
            user: userRecord
              ? {
                  id: userRecord.id,
                  clientId: userRecord.clientId,
                  clientUrl: userRecord.clientUrl ?? undefined,
                  protected: userRecord.protected,
                  metadata: userRecord.metadata ? parseMetadata(userRecord.metadata) : undefined,
                  status: userRecord.actionStatus ?? undefined,
                  statusUpdatedAt: userRecord.actionStatusCreatedAt
                    ? new Date(userRecord.actionStatusCreatedAt).getTime().toString()
                    : undefined,
                }
              : undefined,
          },
        },
      });
    });
  },
);

const recordModerationUsage = inngest.createFunction(
  { id: "record-moderation-usage" },
  { event: "moderation/usage" },
  async ({ event, step }) => {
    const { clerkOrganizationId } = event.data;

    await step.run("create-meter-event", async () => {
      return await createMeterEvent(clerkOrganizationId, "iffy_moderations", 1);
    });
  },
);

export default [moderate, updateUserRecordAfterModeration, sendModerationWebhook, recordModerationUsage];
