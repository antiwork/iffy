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
    slackTeamId?: string;
    slackTeamName?: string;
    slackEnabled?: boolean;
    slackAccessToken?: string;
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

// organizationSlackWebhooks
export async function createSlackWebhook(
  clerkOrganizationId: string,
  data: typeof schema.organizationSlackWebhooks.$inferSelect,
) {
  const organization = await findOrCreateOrganization(clerkOrganizationId);
  const [webhook] = await db
    .insert(schema.organizationSlackWebhooks)
    .values({
      ...data,
      organizationId: organization.id,
      webhookUrl: encrypt(data.webhookUrl),
      configurationUrl: data.configurationUrl && encrypt(data.configurationUrl),
    })
    .returning();

  if (!webhook) {
    throw new Error("Failed to create Slack webhook");
  }

  return webhook;
}
