import { sendWebhook, WebhookEvents } from "@/services/webhook";
import { inngest } from "@/inngest/client";
import db from "@/db";
import * as schema from "@/db/schema";
import { generateAppealToken } from "@/services/appeals";
import { createMessage } from "@/services/messages";
import { sendEmail, renderEmailTemplate } from "@/services/email";
import { pausePaymentsAndPayouts, resumePaymentsAndPayouts } from "@/services/stripe";
import { findOrCreateOrganizationSettings } from "@/services/organization-settings";
import { RenderedTemplate } from "@/emails/types";
import { getAbsoluteUrl } from "@/lib/url";
import { createAppealAction } from "@/services/appeal-actions";
import { eq, and } from "drizzle-orm";
import { decrypt } from "@/services/encrypt";

const updateStripePaymentsAndPayouts = inngest.createFunction(
  { id: "update-stripe-payments-payouts" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { clerkOrganizationId, status, userId } = event.data;

    const user = await step.run("fetch-user", async () => {
      const result = await db.query.users.findFirst({
        where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, userId)),
      });
      if (!result) {
        throw new Error(`User not found: ${userId}`);
      }

      return result;
    });

    const organizationSettings = await step.run("fetch-organization-settings", async () => {
      const result = await db.query.organizationSettings.findFirst({
        where: eq(schema.organizationSettings.clerkOrganizationId, clerkOrganizationId),
      });
      if (!result) {
        throw new Error(`Organization settings not found: ${clerkOrganizationId}`);
      }

      return result;
    });

    await step.run("update-stripe-payouts", async () => {
      if (organizationSettings.stripeApiKey && user.stripeAccountId) {
        switch (status) {
          case "Suspended":
          case "Banned":
            await pausePaymentsAndPayouts(decrypt(organizationSettings.stripeApiKey), user.stripeAccountId);
            break;
          case "Compliant":
            await resumePaymentsAndPayouts(decrypt(organizationSettings.stripeApiKey), user.stripeAccountId);
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
    const { clerkOrganizationId, status, userId } = event.data;

    const user = await step.run("fetch-user", async () => {
      const result = await db.query.users.findFirst({
        where: and(eq(schema.users.clerkOrganizationId, clerkOrganizationId), eq(schema.users.id, userId)),
      });
      if (!result) {
        throw new Error(`User not found: ${userId}`);
      }

      return result;
    });

    await step.run("send-user-action-webhook", async () => {
      const webhook = await db.query.webhookEndpoints.findFirst({
        where: eq(schema.webhookEndpoints.clerkOrganizationId, clerkOrganizationId),
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
        payload: {
          clientId: user.clientId,
        },
      });
    });
  },
);

const sendUserActionEmail = inngest.createFunction(
  { id: "send-user-action-email" },
  { event: "user-action/status-changed" },
  async ({ event, step }) => {
    const { clerkOrganizationId, id, status, lastStatus, userId } = event.data;

    const organizationSettings = await step.run("fetch-organization-settings", async () => {
      return await findOrCreateOrganizationSettings(clerkOrganizationId);
    });

    if (!organizationSettings.emailsEnabled) return;

    const template = await step.run("get-template", async () => {
      let template: RenderedTemplate | undefined;

      switch (status) {
        case "Compliant":
          if (lastStatus === "Suspended") {
            template = await renderEmailTemplate({
              clerkOrganizationId,
              type: "Compliant",
            });
          }
          break;
        case "Suspended":
          template = await renderEmailTemplate({
            clerkOrganizationId,
            type: "Suspended",
            appealUrl: organizationSettings.appealsEnabled
              ? getAbsoluteUrl(`/appeal?token=${generateAppealToken(userId)}`)
              : undefined,
          });
          break;
        case "Banned":
          template = await renderEmailTemplate({
            clerkOrganizationId,
            type: "Banned",
          });
          break;
      }

      return template;
    });

    if (!template) return;

    await step.run("create-message", async () => {
      return await createMessage({
        clerkOrganizationId,
        userActionId: id,
        type: "Outbound",
        toId: userId,
        subject: template.subject,
        text: template.body,
      });
    });

    await step.run("send-email", async () => {
      return await sendEmail({
        clerkOrganizationId,
        userId,
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
    const { clerkOrganizationId, status, userId } = event.data;

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
            eq(schema.userActions.clerkOrganizationId, clerkOrganizationId),
            eq(schema.userActions.userId, userId),
            eq(schema.appeals.actionStatus, "Open"),
          ),
        );

      return result.map((row) => row.appeal);
    });

    if (status === "Compliant") {
      await step.run("approve-open-appeals-if-compliant", async () => {
        for (const appeal of appeals) {
          await createAppealAction({
            clerkOrganizationId,
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
            clerkOrganizationId,
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
