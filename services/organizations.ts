import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";
import { clerkClient } from "@clerk/nextjs/server";

async function _findOrCreateOrganization(clerkOrganizationId: string) {
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

export async function findOrCreateOrganization(clerkOrganizationId: string) {
  const organization = await _findOrCreateOrganization(clerkOrganizationId);

  if (organization.stripeCustomerId) return organization;

  const clerkOrganization = await (
    await clerkClient()
  ).organizations.getOrganization({ organizationId: clerkOrganizationId });

  const customer = await stripe.customers.create({
    name: clerkOrganization.name,
  });

  await db
    .update(schema.organizations)
    .set({
      stripeCustomerId: customer.id,
    })
    .where(eq(schema.organizations.id, organization.id));

  return organization;
}

export async function updateOrganization(
  clerkOrganizationId: string,
  data: {
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

  return updated;
}
