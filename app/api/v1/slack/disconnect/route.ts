import { NextRequest, NextResponse } from "next/server";
import db, { schema } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clerkOrganizationId } = body;
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Missing clerkOrganizationId" } }, { status: 400 });
  }

  const [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.clerkOrganizationId, clerkOrganizationId));

  if (!organization) {
    return NextResponse.json({ error: { message: "Organization not found" } }, { status: 404 });
  }

  const [inboxes] = await db
    .select()
    .from(schema.slackInboxes)
    .where(eq(schema.slackInboxes.clerkOrganizationId, clerkOrganizationId));

  if (!inboxes) {
    return NextResponse.json({ error: { message: "Inboxes not found" } }, { status: 404 });
  }

  await db.delete(schema.slackInboxes).where(eq(schema.slackInboxes.clerkOrganizationId, clerkOrganizationId));

  return NextResponse.json({ message: "Slack access token disconnected successfully." }, { status: 200 });
}
