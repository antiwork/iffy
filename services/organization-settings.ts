import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { encrypt } from "@/services/encrypt";

export async function findOrCreateOrganizationSettings(clerkOrganizationId: string) {
  let [settings] = await db
    .select()
    .from(schema.organizationSettings)
    .where(eq(schema.organizationSettings.clerkOrganizationId, clerkOrganizationId));

  if (settings) return settings;

  [settings] = await db
    .insert(schema.organizationSettings)
    .values({
      clerkOrganizationId,
    })
    .returning();

  if (!settings) {
    throw new Error("Failed to create organization settings");
  }

  return settings;
}

export async function updateOrganizationSettings(
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
  const organizationSettingsRecord = await findOrCreateOrganizationSettings(clerkOrganizationId);
  const [updated] = await db
    .update(schema.organizationSettings)
    .set({
      ...data,
      stripeApiKey: data.stripeApiKey ? encrypt(data.stripeApiKey) : undefined,
    })
    .where(
      and(
        eq(schema.organizationSettings.clerkOrganizationId, clerkOrganizationId),
        eq(schema.organizationSettings.id, organizationSettingsRecord.id),
      ),
    )
    .returning();

  return updated;
}
