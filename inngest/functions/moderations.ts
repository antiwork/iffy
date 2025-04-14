import { sendWebhook } from "@/services/webhook";
import { inngest } from "@/inngest/client";
import db from "@/db";
import { getFlaggedRecordsFromUser } from "@/services/users";
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
    const { organizationId, moderationId, recordId } = event.data;

    const result = await step.run("moderate", async () => {
      return await service.moderate({ organizationId, recordId });
    });

    return await step.run("update-moderation", async () => {
      return await updatePendingModeration({
        organizationId,
        id: moderationId,
        ...result,
      });
    });
  },
);

const updateUserAfterModeration = inngest.createFunction(
  { id: "update-user-after-moderation" },
  { event: "moderation/status-changed" },
  async ({ event, step }) => {
    const { organizationId, recordId, status } = event.data;

    const record = await step.run("fetch-record", async () => {
      const result = await db.query.records.findFirst({
        where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, recordId)),
        with: {
          user: true,
        },
      });

      if (!result) {
        throw new Error(`Record not found: ${recordId}`);
      }
      return result;
    });

    const user = record.user;
    if (!user) {
      return;
    }

    const flaggedRecords = await step.run("fetch-user-flagged-records", async () => {
      return await getFlaggedRecordsFromUser({ organizationId, id: user.id });
    });

    const organization = await step.run("fetch-organization", async () => {
      return await findOrCreateOrganization(organizationId);
    });

    let actionStatus: (typeof schema.userActionStatus.enumValues)[number] | undefined;
    let actionVia:
      | { via: "Automation Flagged Record"; viaRecordId: string }
      | { via: "Automation All Compliant" }
      | undefined;

    if (
      status === "Flagged" &&
      (!user.actionStatus || user.actionStatus === "Compliant") &&
      !user.protected &&
      flaggedRecords.length >= organization.suspensionThreshold
    ) {
      actionStatus = "Suspended";
      actionVia = { via: "Automation Flagged Record", viaRecordId: recordId };
    }

    if (
      status === "Compliant" &&
      flaggedRecords.length < organization.suspensionThreshold &&
      user.actionStatus === "Suspended"
    ) {
      actionStatus = "Compliant";
      actionVia = { via: "Automation All Compliant" };
    }

    if (!actionStatus || !actionVia) {
      return;
    }

    await step.run("create-user-action", async () => {
      return await createUserAction({
        organizationId,
        userId: user.id,
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
    const { organizationId, id, status, recordId } = event.data;

    const moderation = await step.run("fetch-moderation", async () => {
      const result = await db.query.moderations.findFirst({
        where: and(eq(schema.moderations.organizationId, organizationId), eq(schema.moderations.id, id)),
      });
      if (!result) {
        throw new Error(`Moderation not found: ${id}`);
      }
      return result;
    });

    const record = await step.run("fetch-record", async () => {
      const result = await db.query.records.findFirst({
        where: and(eq(schema.records.organizationId, organizationId), eq(schema.records.id, recordId)),
        with: {
          user: true,
        },
      });

      if (!result) {
        throw new Error(`Record not found: ${recordId}`);
      }
      return result;
    });

    const user = record.user;

    await step.run("send-webhook", async () => {
      const webhook = await db.query.webhookEndpoints.findFirst({
        where: eq(schema.webhookEndpoints.organizationId, organizationId),
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
            user: user
              ? {
                id: user.id,
                clientId: user.clientId,
                clientUrl: user.clientUrl ?? undefined,
                protected: user.protected,
                metadata: user.metadata ? parseMetadata(user.metadata) : undefined,
                status: user.actionStatus ?? undefined,
                statusUpdatedAt: user.actionStatusCreatedAt
                  ? new Date(user.actionStatusCreatedAt).getTime().toString()
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
    const { organizationId } = event.data;

    await step.run("create-meter-event", async () => {
      return await createMeterEvent(organizationId, "iffy_moderations", 1);
    });
  },
);

export default [moderate, updateUserAfterModeration, sendModerationWebhook, recordModerationUsage];
