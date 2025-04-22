import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";

export async function findOrganization(organizationId: string) {
  const [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId));

  if (!organization) {
    throw new Error("Organization not found");
  }

  return organization;
}

export async function updateOrganization(
  organizationId: string,
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
  const organization = await findOrganization(organizationId);
  const [updated] = await db
    .update(schema.organizations)
    .set({
      ...data,
      stripeApiKey: data.stripeApiKey ? encrypt(data.stripeApiKey) : undefined,
    })
    .where(and(eq(schema.organizations.id, organizationId), eq(schema.organizations.id, organization.id)))
    .returning();

  if (!updated) {
    throw new Error("Failed to update organization");
  }

  return updated;
}
