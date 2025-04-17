import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";

export async function findOrCreateOrganization(authOrganizationId: string) {
  let [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.authOrganizationId, authOrganizationId));

  if (organization) return organization;

  [organization] = await db
    .insert(schema.organizations)
    .values({
      authOrganizationId,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization");
  }

  return organization;
}

export async function updateOrganization(
  authOrganizationId: string,
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
  const organization = await findOrCreateOrganization(authOrganizationId);
  const [updated] = await db
    .update(schema.organizations)
    .set({
      ...data,
      stripeApiKey: data.stripeApiKey ? encrypt(data.stripeApiKey) : undefined,
    })
    .where(
      and(
        eq(schema.organizations.authOrganizationId, authOrganizationId),
        eq(schema.organizations.id, organization.id),
      ),
    )
    .returning();

  if (!updated) {
    throw new Error("Failed to update organization");
  }

  return updated;
}
