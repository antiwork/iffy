import { NextRequest, NextResponse } from "next/server";

import { moderateAdapter, ModerateRequestData } from "./schema";
import * as schema from "@/db/schema";
import { createModeration, moderate } from "@/services/moderations";
import { createOrUpdateRecord } from "@/services/records";
import { createOrUpdateUser } from "@/services/users";
import { parseRequestBody } from "@/app/api/parse";
import { inngest } from "@/inngest/client";
import { authenticateRequest } from "../../auth";

export async function POST(req: NextRequest) {
  const [isValid, clerkOrganizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, ModerateRequestData, moderateAdapter);
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
    clientUrl: data.clientUrl,
    userId: user?.id,
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
    clerkOrganizationId,
    recordId: record.id,
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
      ...(user ? { user: user.id } : {}),
      message: "Success",
      // TODO(s3ththompson): deprecate
      flagged: result.status === "Flagged",
      categoryIds: result.ruleIds,
    },
    { status: 200 },
  );
}
