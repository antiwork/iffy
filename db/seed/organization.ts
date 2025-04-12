import db from "../index";
import * as schema from "../schema";
import { findOrCreateOrganization } from "@/services/organizations";
import { eq } from "drizzle-orm";

export async function seedOrganization(organizationId: string) {
  const organization = await findOrCreateOrganization(organizationId);
  const [updatedOrganization] = await db
    .update(schema.organizations)
    .set({ testModeEnabled: false, emailsEnabled: true })
    .where(eq(schema.organizations.id, organization.id))
    .returning();
  return [updatedOrganization];
}
