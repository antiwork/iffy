import { sendWebhook, WebhookEvents } from "@/services/webhook";
import { inngest } from "@/inngest/client";
import db from "@/db";
import * as schema from "@/db/schema";
import { generateAppealToken } from "@/services/appeals";
import { createMessage } from "@/services/messages";
import { sendEmail, renderEmailTemplate } from "@/services/email";
import { pausePayments, resumePayments } from "@/services/stripe/accounts";
import { findOrCreateOrganization } from "@/services/organizations";
import { RenderedTemplate } from "@/emails/types";
import { getAbsoluteUrl } from "@/lib/url";
import { createAppealAction } from "@/services/appeal-actions";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/services/encrypt";
import { parseMetadata } from "@/services/metadata";

const updateStripePaymentsAndPayouts = inngest.createFunction(
  { id: "update-stripe-payments-payouts" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { organizationId, status, userRecordId } = event.data;

    const userRecord = await step.run("fetch-user-record", async () => {
      const result = await db.query.userRecords.findFirst({
        where: and(eq(schema.userRecords.organizationId, organizationId), eq(schema.userRecords.id, userRecordId)),
      });
      if (!result) {
        throw new Error(`User record not found: ${userRecordId}`);
      }

      return result;
    });

    const organization = await step.run("fetch-organization", async () => {
      const result = await db.query.organizations.findFirst({
        where: eq(schema.organizations.id, organizationId),
      });
      if (!result) {
        throw new Error(`Organization settings not found: ${organizationId}`);
      }

      return result;
    });

    await step.run("update-stripe-payouts", async () => {
      if (organization.stripeApiKey && userRecord.stripeAccountId) {
        switch (status) {
          case "Suspended":
          case "Banned":
            await pausePayments(decrypt(organization.stripeApiKey), userRecord.stripeAccountId);
            break;
          case "Compliant":
            await resumePayments(decrypt(organization.stripeApiKey), userRecord.stripeAccountId);
            break;
        }
      }
    });
  },
);

const sendUserActionWebhook = inngest.createFunction(
  { id: "send-user-action-webhook" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { organizationId, id, status } = event.data;

    const userAction = await step.run("fetch-user-action", async () => {
      const result = await db.query.userActions.findFirst({
        where: and(eq(schema.userActions.organizationId, organizationId), eq(schema.userActions.id, id)),
      });
      if (!result) {
        throw new Error(`Record user action not found: ${id}`);
      }

      return result;
    });

    const userRecord = await step.run("fetch-user-record", async () => {
      const result = await db.query.userRecords.findFirst({
        where: and(
          eq(schema.userRecords.organizationId, organizationId),
          eq(schema.userRecords.id, userAction.userRecordId),
        ),
      });
      if (!result) {
        throw new Error(`User record not found: ${userAction.userRecordId}`);
      }

      return result;
    });

    await step.run("send-user-action-webhook", async () => {
      const webhook = await db.query.webhookEndpoints.findFirst({
        where: eq(schema.webhookEndpoints.organizationId, organizationId),
      });
      if (!webhook) throw new Error("No webhook found");

      let eventType: keyof WebhookEvents;
      switch (status) {
        case "Suspended":
          eventType = "user.suspended";
          break;
        case "Banned":
          eventType = "user.banned";
          break;
        case "Compliant":
          eventType = "user.compliant";
          break;
        default:
          throw new Error(`Unexpected status: ${status}`);
      }

      await sendWebhook({
        id: webhook.id,
        event: eventType,
        data: {
          id: userAction.id,
          payload: {
            id: userRecord.id,
            clientId: userRecord.clientId,
            clientUrl: userRecord.clientUrl ?? undefined,
            protected: userRecord.protected,
            metadata: userRecord.metadata ? parseMetadata(userRecord.metadata) : undefined,
            status: userAction.status,
            statusUpdatedAt: new Date(userAction.createdAt).getTime().toString(),
            statusUpdatedVia: userAction.via,
          },
        },
      });
    });
  },
);

const sendUserActionEmail = inngest.createFunction(
  { id: "send-user-action-email" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { organizationId, id, status, lastStatus, userRecordId } = event.data;

    const organization = await step.run("fetch-organization", async () => {
      return await findOrCreateOrganization({ id: organizationId });
    });

    if (!organization.emailsEnabled) return;

    const template = await step.run("get-template", async () => {
      let template: RenderedTemplate | undefined;

      switch (status) {
        case "Compliant":
          if (lastStatus === "Suspended") {
            template = await renderEmailTemplate({
              organizationId,
              type: "Compliant",
            });
          }
          break;
        case "Suspended":
          template = await renderEmailTemplate({
            organizationId,
            type: "Suspended",
            appealUrl: organization.appealsEnabled
              ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(userRecordId)}`)
              : undefined,
          });
          break;
        case "Banned":
          template = await renderEmailTemplate({
            organizationId,
            type: "Banned",
          });
          break;
      }

      return template;
    });

    if (!template) return;

    await step.run("create-message", async () => {
      return await createMessage({
        organizationId,
        userActionId: id,
        type: "Outbound",
        toId: userRecordId,
        subject: template.subject,
        text: template.body,
      });
    });

    await step.run("send-email", async () => {
      return await sendEmail({
        organizationId,
        userRecordId,
        subject: template.subject,
        html: template.html,
        text: template.body,
      });
    });
  },
);

const updateAppealsAfterUserAction = inngest.createFunction(
  { id: "update-appeals-after-user-action" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { organizationId, status, userRecordId } = event.data;

    if (status === "Suspended") return;

    const appeals = await step.run("fetch-open-appeals", async () => {
      const result = await db
        .select({
          appeal: schema.appeals,
        })
        .from(schema.appeals)
        .innerJoin(schema.userActions, eq(schema.userActions.id, schema.appeals.userActionId))
        .where(
          and(
            eq(schema.userActions.organizationId, organizationId),
            eq(schema.userActions.userRecordId, userRecordId),
            eq(schema.appeals.actionStatus, "Open"),
          ),
        );

      return result.map((row) => row.appeal);
    });

    if (status === "Compliant") {
      await step.run("approve-open-appeals-if-compliant", async () => {
        for (const appeal of appeals) {
          await createAppealAction({
            organizationId,
            appealId: appeal.id,
            status: "Approved",
            via: "Automation",
          });
        }
      });
    }

    if (status === "Banned") {
      await step.run("reject-open-appeals-if-banned", async () => {
        for (const appeal of appeals) {
          await createAppealAction({
            organizationId,
            appealId: appeal.id,
            status: "Rejected",
            via: "Automation",
          });
        }
      });
    }
  },
);

export default [
  updateStripePaymentsAndPayouts,
  sendUserActionWebhook,
  sendUserActionEmail,
  updateAppealsAfterUserAction,
];
