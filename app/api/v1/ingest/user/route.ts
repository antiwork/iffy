import { NextRequest, NextResponse } from "next/server";
import { IngestUserRequestData } from "./schema";
import { validateApiKey } from "@/services/api-keys";
import { parseRequestDataWithSchema } from "@/app/api/parse";
import { createOrUpdateUser } from "@/services/users";

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

  const user = await createOrUpdateUser({
    clerkOrganizationId,
    clientId: data.clientId,
    clientUrl: data.clientUrl,
    email: data.email,
    name: data.name,
    username: data.username,
    initialProtected: data.protected,
    stripeAccountId: data.stripeAccountId,
    metadata: data.metadata,
  });

  return NextResponse.json({ id: user.id, message: "Success" }, { status: 200 });
}
