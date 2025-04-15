import { getApiKeys } from "@/services/api-keys";
import { Settings } from "./settings";
import { findOrCreateOrganization } from "@/services/organizations";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Settings | Iffy",
};

import db from "@/db";
import * as schema from "@/db/schema";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { decrypt } from "@/services/encrypt";

export default async function DeveloperPage() {
  const { orgId } = await authWithOrgSubscription();

  const keys = await getApiKeys({ organizationId: orgId });
  const webhookEndpoint = await db.query.webhookEndpoints.findFirst({
    where: eq(schema.webhookEndpoints.organizationId, orgId),
  });
  if (webhookEndpoint) {
    webhookEndpoint.secret = decrypt(webhookEndpoint.secret);
  }

  const organization = await findOrCreateOrganization(orgId);

  return (
    <div className="px-12 py-8">
      <Settings
        keys={keys}
        webhookEndpoint={webhookEndpoint}
        organization={{
          stripeApiKey: Boolean(organization.stripeApiKey),
        }}
      />
    </div>
  );
}
