import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";

import { moderateAdapter, ModerateRequestData } from "./schema";
import db from "@/db";
import * as schema from "@/db/schema";
import { validateApiKey } from "@/services/api-keys";
import { createModeration, moderate } from "@/services/moderations";
import { createOrUpdateRecord } from "@/services/records";

async function parseRequestDataWithSchema<T>(
  req: NextRequest,
  schema: ZodSchema<T>,
  adapter?: (data: unknown) => unknown,
): Promise<{ data: T; error?: never } | { data?: never; error: { message: string } }> {
  try {
    let body = await req.json();
    if (adapter) {
      body = adapter(body);
    }
    const result = schema.safeParse(body);
    if (result.success) {
      return { data: result.data };
    }
    const { message } = fromZodError(result.error);
    return { error: { message } };
  } catch {
    return { error: { message: "Invalid request body" } };
  }
}

export async function POST(req: NextRequest) {
  const { data, error } = await parseRequestDataWithSchema(req, ModerateRequestData, moderateAdapter);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  let user: typeof schema.users.$inferSelect | undefined;
  if (data.user) {
    [user] = await db
      .insert(schema.users)
      .values({
        clerkOrganizationId,
        clientId: data.user.clientId,
        clientUrl: data.user.clientUrl,
        email: data.user.email,
        name: data.user.name,
        username: data.user.username,
        protected: data.user.protected,
        stripeAccountId: data.user.stripeAccountId,
      })
      .onConflictDoUpdate({
        target: schema.users.clientId,
        set: {
          clientUrl: data.user.clientUrl,
          email: data.user.email,
          name: data.user.name,
          username: data.user.username,
          protected: data.user.protected,
          stripeAccountId: data.user.stripeAccountId,
        },
      })
      .returning();
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
  });

  const result = await moderate({
    clerkOrganizationId,
    recordId: record.id,
  });

  await createModeration({
    clerkOrganizationId,
    recordId: record.id,
    ...result,
    via: "AI",
  });

  return NextResponse.json(
    {
      status: result.status,
      // TODO(s3ththompson): deprecate
      flagged: result.status === "Flagged",
      categoryIds: result.ruleIds,
    },
    { status: 200 },
  );
}
