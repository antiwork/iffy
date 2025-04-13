import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";

export async function findOrCreateOrganization(clerkOrganizationId: string) {
  let [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.clerkOrganizationId, clerkOrganizationId));

  if (organization) return organization;

  [organization] = await db
    .insert(schema.organizations)
    .values({
      clerkOrganizationId,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization");
  }

  return organization;
}

export async function updateOrganization(
  clerkOrganizationId: string,
  data: {
    stripeCustomerId?: string;
    emailsEnabled?: boolean;
    testModeEnabled?: boolean;
    appealsEnabled?: boolean;
    stripeApiKey?: string;
    moderationPercentage?: number;
    suspensionThreshold?: number;
  },
) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  const [updated] = await db
    .update(schema.organizations)
    .set({
      ...data,
      stripeApiKey: data.stripeApiKey ? encrypt(data.stripeApiKey) : undefined,
    })
    .where(
      and(
        eq(schema.organizations.clerkOrganizationId, clerkOrganizationId),
        eq(schema.organizations.id, organization.id),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to update organization");
  }

  return updated;
}

export async function createSlackInbox(
  clerkOrganizationId: string,
  data: Omit<typeof schema.slackInboxes.$inferSelect, "id">,
) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  const [inbox] = await db
    .insert(schema.slackInboxes)
    .values({
      ...data,
      clerkOrganizationId: organization.clerkOrganizationId,
    })
    .returning();

  if (!inbox) {
    throw new Error("Failed to create Slack inbox");
  }

  return inbox;
}

export async function findSlackInboxes(clerkOrganizationId: string) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  const inboxes = await db
    .select()
    .from(schema.slackInboxes)
    .where(eq(schema.slackInboxes.clerkOrganizationId, organization.clerkOrganizationId));

  return inboxes;
}
