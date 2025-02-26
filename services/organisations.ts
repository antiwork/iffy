import db from "@/db";
import { organizations } from "@/db/tables";
import { eq } from "drizzle-orm";

export async function getOrganizationByStripeCustomerId(stripeCustomerId: string) {
  try {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.stripeCustomerId, stripeCustomerId));

    return organization;
  } catch (error) {
    console.error("Failed to get organisation by Stripe", error);
    throw error;
  }
}

export async function getOrganizationByClerkOrgId(clerkOrgId: string) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, clerkOrgId),
    });
    return org;
  } catch (error) {
    console.error("Failed to get organisation by Clerk:", error);
    throw error;
  }
}

export async function createOrganization(clerkOrgId: string, stripeCustomerId: string) {
  try {
    const [organization] = await db
      .insert(organizations)
      .values({
        clerkOrgId,
        stripeCustomerId,
      })
      .returning();

    return organization;
  } catch (error) {
    console.error("Failed to create organisation:", error);
    throw error;
  }
}

export async function deleteOrganizationById(id: string) {
  try {
    const [deletedOrganisation] = await db.delete(organizations).where(eq(organizations.id, id)).returning();

    return deletedOrganisation;
  } catch (error) {
    console.error("Failed to delete organisation by ID:", error);
    throw error;
  }
}
