import { NextRequest, NextResponse } from "next/server";

import { IngestDeleteRequestData, ingestUpdateAdapter, IngestUpdateRequestData } from "./schema";
import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { createPendingModeration } from "@/services/moderations";
import { createOrUpdateUser } from "@/services/users";
import { createOrUpdateRecord, deleteRecord } from "@/services/records";
import { inngest } from "@/inngest/client";
import { parseRequestBody } from "@/app/api/parse";
import { findOrCreateOrganization } from "@/services/organizations";
import { authenticateRequest } from "../../auth";
import { hasActiveSubscription } from "@/services/stripe/subscriptions";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, IngestUpdateRequestData, ingestUpdateAdapter);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (env.ENABLE_BILLING && !(await hasActiveSubscription(clerkOrganizationId))) {
    return NextResponse.json(
      { error: { message: "No active subscription. Please sign up for a subscription." } },
      { status: 403 },
    );
  }

  let user: typeof schema.endUsers.$inferSelect | undefined;
  if (data.user) {
    user = await createOrUpdateUser({
      clerkOrganizationId,
      clientId: data.user.clientId,
      clientUrl: data.user.clientUrl,
      email: data.user.email,
      name: data.user.name,
      username: data.user.username,
      initialProtected: data.user.protected,
      stripeAccountId: data.user.stripeAccountId,
      metadata: data.user.metadata,
    });
  }

  const content = typeof data.content === "string" ? { text: data.content } : data.content;

  const record = await createOrUpdateRecord({
    clerkOrganizationId,
    clientId: data.clientId,
    name: data.name,
    entity: data.entity,
    text: content.text,
    imageUrls: content.imageUrls,
    externalUrls: content.externalUrls,
    clientUrl: data.clientUrl,
    userId: user?.id,
    metadata: data.metadata,
  });

  const organization = await findOrCreateOrganization(clerkOrganizationId);

  let moderationThreshold = false;

  // always moderate currently flagged records, to test for compliance after updates
  if (record && record.moderationStatus === "Flagged") {
    moderationThreshold = true;
  }

  // always moderate records of suspended users
  if (user && user.actionStatus === "Suspended") {
    moderationThreshold = true;
  }

  // moderate based on configured percentage
  if (organization && Math.random() * 100 < organization.moderationPercentage) {
    moderationThreshold = true;
  }

  let pendingModeration: typeof schema.moderations.$inferSelect | undefined;
  if (moderationThreshold && !record.protected) {
    pendingModeration = await createPendingModeration({
      clerkOrganizationId,
      recordId: record.id,
      via: "AI",
    });
    try {
      await inngest.send({
        name: "moderation/moderated",
        data: {
          clerkOrganizationId,
          moderationId: pendingModeration.id,
          recordId: record.id,
        },
      });
      await inngest.send({
        name: "moderation/usage",
        data: {
          clerkOrganizationId,
          id: pendingModeration.id,
          recordId: record.id,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }

  return NextResponse.json(
    {
      id: record.id,
      moderation: pendingModeration?.id ?? null,
      ...(user ? { user: user.id } : {}),
      message: "Success",
    },
    { status: 200 },
  );
}

export async function DELETE(req: NextRequest) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, IngestDeleteRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.organizationId, clerkOrganizationId), eq(schema.records.clientId, data.clientId)),
  });
  if (!record) {
    return NextResponse.json({ error: { message: "Record not found" } }, { status: 404 });
  }

  await deleteRecord(clerkOrganizationId, record.id);
  return NextResponse.json({ message: "Success" }, { status: 200 });
}
