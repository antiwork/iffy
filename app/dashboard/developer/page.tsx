import { getApiKeys } from "@/services/api-keys";
import { Settings } from "./settings";
import { findOrCreateOrganizationSettings } from "@/services/organization-settings";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Settings | Iffy"
};

import db from "@/db";
import * as schema from "@/db/schema";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { decrypt } from "@/services/encrypt";

export default async function DeveloperPage() {
  const { orgId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const keys = await getApiKeys({ clerkOrganizationId: orgId });
  const webhookEndpoint = await db.query.webhookEndpoints.findFirst({
    where: eq(schema.webhookEndpoints.clerkOrganizationId, orgId),
  });
  if (webhookEndpoint) {
    webhookEndpoint.secret = decrypt(webhookEndpoint.secret);
  }

  const organizationSettings = await findOrCreateOrganizationSettings(orgId);

  return (
    <div className="px-12 py-8">
      <Settings
        keys={keys}
        webhookEndpoint={webhookEndpoint}
        organizationSettings={{
          stripeApiKey: Boolean(organizationSettings.stripeApiKey),
        }}
      />
    </div>
  );
}
