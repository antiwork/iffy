import { NextRequest, NextResponse } from "next/server";

import { moderateAdapter, ModerateRequestData } from "./schema";
import * as schema from "@/db/schema";
import { createModeration, moderate } from "@/services/moderations";
import { createOrUpdateRecord } from "@/services/records";
import { createOrUpdateUserRecord } from "@/services/user-records";
import { parseRequestBody } from "@/app/api/parse";
import { inngest } from "@/inngest/client";
import { authenticateRequest } from "../../auth";
import { hasActiveSubscription } from "@/services/stripe/subscriptions";
import { env } from "@/lib/env";

export async function POST(req: NextRequest) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, ModerateRequestData, moderateAdapter);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (env.ENABLE_BILLING && !(await hasActiveSubscription(clerkOrganizationId))) {
    return NextResponse.json(
      { error: { message: "No active subscription. Please sign up for a subscription." } },
      { status: 403 },
    );
  }

  const passthrough = data.passthrough;

  let userRecord: typeof schema.userRecords.$inferSelect | undefined;
  if (data.user) {
    const { email, name, username, ...rest } = data.user;
    userRecord = await createOrUpdateUserRecord({
      clerkOrganizationId,
      clientId: rest.clientId,
      clientUrl: rest.clientUrl,
      initialProtected: rest.protected,
      stripeAccountId: rest.stripeAccountId,
      metadata: rest.metadata,
      ...(passthrough ? {} : { email, name, username }),
    });
  }

  const content = typeof data.content === "string" ? { text: data.content } : data.content;

  const { name, ...rest } = data;
  const record = await createOrUpdateRecord({
    clerkOrganizationId,
    clientId: rest.clientId,
    entity: rest.entity,
    clientUrl: rest.clientUrl,
    userRecordId: userRecord?.id,
    metadata: rest.metadata,
    ...(passthrough
      ? {}
      : { name, text: content.text, imageUrls: content.imageUrls, externalUrls: content.externalUrls }),
  });

  if (record.protected) {
    return NextResponse.json(
      {
        id: record.id,
        message: "Record is protected",
      },
      { status: 403 },
    );
  }

  const result = await moderate({
    clerkOrganizationId,
    recordId: record.id,
    passthroughContext: passthrough
      ? {
          name,
          text: content.text,
          imageUrls: content.imageUrls ?? [],
          externalUrls: content.externalUrls ?? [],
        }
      : undefined,
  });

  const moderation = await createModeration({
    clerkOrganizationId,
    recordId: record.id,
    ...result,
    via: "AI",
  });

  try {
    await inngest.send({
      name: "moderation/usage",
      data: {
        clerkOrganizationId,
        id: moderation.id,
        recordId: record.id,
      },
    });
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json(
    {
      status: result.status,
      id: record.id,
      moderation: moderation.id,
      ...(userRecord ? { user: userRecord.id } : {}),
      message: "Success",
      // TODO(s3ththompson): deprecate
      flagged: result.status === "Flagged",
      categoryIds: result.ruleIds,
    },
    { status: 200 },
  );
}
