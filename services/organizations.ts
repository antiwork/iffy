import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";

interface FindOrCreateOrganizationInput {
  id?: string;
  name?: string;
  logo?: string;
  slug?: string;
}

export async function findOrCreateOrganization({ id, name, logo, slug }: FindOrCreateOrganizationInput) {
  if (id) {
    let [organization] = await db.select().from(schema.organizations).where(eq(schema.organizations.id, id));
    if (organization) return organization;
  }

  if (!name) throw new Error("Failed to create organization");

  let [organization] = await db
    .insert(schema.organizations)
    .values({
      name,
      logo,
      slug,
    })
    .returning();

  if (!organization) {
    throw new Error("Failed to create organization");
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
  const organization = await findOrCreateOrganization({ id: organizationId });
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
