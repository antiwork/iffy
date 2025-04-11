import { NextRequest, NextResponse } from "next/server";
import db, { schema } from "@/db";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { clerkOrganizationId } = body;
  if (!clerkOrganizationId) {
    return NextResponse.json({ error: { message: "Missing clerkOrganizationId" } }, { status: 400 });
  }

  // get the org
  const [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.clerkOrganizationId, clerkOrganizationId));

  if (!organization) {
    return NextResponse.json({ error: { message: "Organization not found" } }, { status: 404 });
  }

  // check if slack is enabled
  if (!organization.slackEnabled) {
    return NextResponse.json({ error: { message: "Slack is not enabled for this organization" } }, { status: 403 });
  }

  const [webhooks] = await db
    .select()
    .from(schema.organizationSlackWebhooks)
    .where(eq(schema.organizationSlackWebhooks.organizationId, organization.id));

  if (!webhooks) {
    return NextResponse.json({ error: { message: "Slack is not connected" } }, { status: 403 });
  }

  // delete the webhooks
  await db.delete(schema.organizationSlackWebhooks).where(eq(schema.organizationSlackWebhooks.id, webhooks.id));

  // delete the organization slack access token
  await db
    .update(schema.organizations)
    .set({
      slackAccessToken: null,
      slackEnabled: false,
      slackTeamId: null,
      slackTeamName: null,
    })
    .where(eq(schema.organizations.id, organization.id));

  // todo: remove the actual integration from slack (could be done with webhooks or api)
  // this is a placeholder for now for local testing

  return NextResponse.json({ message: "Slack access token disconnected successfully." }, { status: 200 });
}
