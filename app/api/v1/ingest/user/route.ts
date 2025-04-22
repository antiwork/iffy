import { NextRequest, NextResponse } from "next/server";
import { IngestUserRequestData } from "./schema";
import { parseRequestBody } from "@/app/api/parse";
import { createOrUpdateUserRecord } from "@/services/user-records";
import { authenticateRequest } from "@/app/api/auth";

export async function POST(req: NextRequest) {
  const [isValid, organizationId] = await authenticateRequest(req);
  if (!isValid) {
    return NextResponse.json({ error: { message: "Invalid API key" } }, { status: 401 });
  }

  const { data, error } = await parseRequestBody(req, IngestUserRequestData);
  if (error) {
    return NextResponse.json({ error }, { status: 400 });
  }

  const userRecord = await createOrUpdateUserRecord({
    organizationId,
    clientId: data.clientId,
    clientUrl: data.clientUrl,
    email: data.email,
    name: data.name,
    username: data.username,
    initialProtected: data.protected,
    stripeAccountId: data.stripeAccountId,
    metadata: data.metadata,
  });

  return NextResponse.json({ id: userRecord.id, message: "Success" }, { status: 200 });
}
