"use server";

import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { decrypt, encrypt } from "./encrypt";

type PublicUser = {
  id: string;
  clientId: string;
  clientUrl?: string;
  protected: boolean;
  metadata?: Record<string, string>;
  status?: (typeof schema.userActionStatus.enumValues)[number];
  statusUpdatedAt?: string;
  statusUpdatedVia?: (typeof schema.via.enumValues)[number];
};

type PublicRecord = {
  id: string;
  clientId: string;
  clientUrl?: string;
  name: string;
  entity: string;
  protected: boolean;
  metadata?: Record<string, string>;
  status?: (typeof schema.moderationStatus.enumValues)[number];
  statusUpdatedAt?: string;
  statusUpdatedVia?: (typeof schema.via.enumValues)[number];
  user?: PublicUser;
};

type PublicModeration = {
  id: string;
};

type PublicUserAction = {
  id: string;
};

export type WebhookEvents = {
  "record.flagged": PublicModeration & { payload: PublicRecord };
  "record.compliant": PublicModeration & { payload: PublicRecord };
  "user.suspended": PublicUserAction & { payload: PublicUser };
  "user.compliant": PublicUserAction & { payload: PublicUser };
  "user.banned": PublicUserAction & { payload: PublicUser };
};

export async function createWebhook({ clerkOrganizationId, url }: { clerkOrganizationId: string; url: string }) {
  const secret = crypto.randomBytes(32).toString("hex");
  const [webhook] = await db
    .insert(schema.webhookEndpoints)
    .values({
      clerkOrganizationId,
      url,
      secret: encrypt(secret),
    })
    .returning();

  if (!webhook) {
    throw new Error("Failed to create webhook");
  }

  webhook.secret = decrypt(webhook.secret);
  return webhook;
}

export async function updateWebhookUrl({
  clerkOrganizationId,
  id,
  url,
}: {
  clerkOrganizationId: string;
  id: string;
  url: string;
}) {
  const [updatedWebhook] = await db
    .update(schema.webhookEndpoints)
    .set({
      url,
    })
    .where(
      and(eq(schema.webhookEndpoints.id, id), eq(schema.webhookEndpoints.organizationId, clerkOrganizationId)),
    )
    .returning();

  if (!updatedWebhook) {
    throw new Error("Webhook not found or not authorized to update");
  }

  return updatedWebhook;
}

export async function sendWebhook<T extends keyof WebhookEvents>({
  id,
  event,
  data,
}: {
  id: string;
  event: T;
  data: WebhookEvents[T];
}) {
  return await db.transaction(async (tx) => {
    const webhook = await tx.query.webhookEndpoints.findFirst({
      where: eq(schema.webhookEndpoints.id, id),
    });

    if (!webhook) {
      throw new Error("Webhook not found");
    }

    webhook.secret = decrypt(webhook.secret);

    const timestamp = Date.now().toString();
    const body = JSON.stringify({ event, timestamp, ...data });
    const signature = crypto.createHmac("sha256", webhook.secret).update(body).digest("hex");

    try {
      const response = await fetch(webhook.url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-Signature": signature,
        },
        body,
      });

      if (!response.ok) {
        throw new Error(`Error sending webhook: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error sending webhook:", error);
      throw error;
    }

    return webhook;
  });
}
