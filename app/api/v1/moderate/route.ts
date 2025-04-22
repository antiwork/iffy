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
  const [isValid, organizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, ModerateRequestData, moderateAdapter);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  if (env.ENABLE_BILLING && !(await hasActiveSubscription(organizationId))) {
    return NextResponse.json(
      { error: { message: "No active subscription. Please sign up for a subscription." } },
      { status: 403 },
    );
  }

  let userRecord: typeof schema.userRecords.$inferSelect | undefined;
  if (data.user) {
    userRecord = await createOrUpdateUserRecord({
      organizationId,
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
    organizationId,
    clientId: data.clientId,
    name: data.name,
    entity: data.entity,
    text: content.text,
    imageUrls: content.imageUrls,
    clientUrl: data.clientUrl,
    userRecordId: userRecord?.id,
    metadata: data.metadata,
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
    organizationId,
    recordId: record.id,
  });

  const moderation = await createModeration({
    organizationId,
    recordId: record.id,
    ...result,
    via: "AI",
  });

  try {
    await inngest.send({
      name: "moderation/usage",
      data: {
        organizationId,
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
