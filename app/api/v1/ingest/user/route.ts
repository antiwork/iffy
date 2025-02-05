import { NextRequest, NextResponse } from "next/server";
import type { ZodSchema } from "zod";
import { fromZodError } from "zod-validation-error";
import { IngestUserRequestData } from "./schema";
import db from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { validateApiKey } from "@/services/api-keys";

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
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }
  const apiKey = authHeader.split(" ")[1];
  const clerkOrganizationId = await validateApiKey(apiKey);
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestDataWithSchema(req, IngestUserRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const [user] = await db
    .insert(schema.recordUsers)
    .values({
      clerkOrganizationId,
      clientId: data.clientId,
      clientUrl: data.clientUrl,
      email: data.email,
      name: data.name,
      username: data.username,
      protected: data.protected,
      stripeAccountId: data.stripeAccountId,
    })
    .onConflictDoUpdate({
      target: schema.recordUsers.clientId,
      set: {
        clientUrl: data.clientUrl,
        email: data.email,
        name: data.name,
        username: data.username,
        protected: data.protected,
        stripeAccountId: data.stripeAccountId,
      },
    })
    .returning();

  return NextResponse.json({ message: "Success" }, { status: 200 });
}
