import { NextRequest, NextResponse } from "next/server";

import { IngestDeleteRequestData, ingestUpdateAdapter, IngestUpdateRequestData } from "./schema";
import db from "@/db";
import * as schema from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { validateApiKey } from "@/services/api-keys";
import { createPendingModeration } from "@/services/moderations";
import { createOrUpdateUser } from "@/services/users";
import { createOrUpdateRecord, deleteRecord } from "@/services/records";
import { inngest } from "@/inngest/client";
import { parseRequestBody } from "@/app/api/parse";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, IngestUpdateRequestData, ingestUpdateAdapter);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  let user: typeof schema.users.$inferSelect | undefined;
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

  const organizationSettings = await db.query.organizationSettings.findFirst({
    where: eq(schema.organizationSettings.clerkOrganizationId, clerkOrganizationId),
  });

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
  if (organizationSettings && Math.random() * 100 < organizationSettings.moderationPercentage) {
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
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, IngestDeleteRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, clerkOrganizationId), eq(schema.records.clientId, data.clientId)),
  });
  if (!record) {
    return NextResponse.json({ error: { message: "Record not found" } }, { status: 404 });
  }

  await deleteRecord(clerkOrganizationId, record.id);
  return NextResponse.json({ message: "Success" }, { status: 200 });
}
