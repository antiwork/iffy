import db from "@/db";
import { organizations } from "@/db/tables";
import { eq } from "drizzle-orm";

export async function getOrganisationByStripeCustomerId(stripeCustomerId: string) {
  try {
    const [organization] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.stripeCustomerId, stripeCustomerId));

    return organization;
  } catch (error) {
    console.log("Failed to get organisation by Stripe", error);
    throw error;
  }
}

export async function getOrganisationByClerkOrgId(clerkOrgId: string) {
  try {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.clerkOrgId, clerkOrgId),
    });
    return org;
  } catch (error) {
    console.log("Failed to get organisation by Clerk:", error);
    throw error;
  }
}

export async function createOrganisation(clerkOrgId: string, stripeCustomerId: string) {
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
