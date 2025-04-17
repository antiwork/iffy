import DynamicLayout from "./dynamic-layout";
import OrganizationList from "@/components/select-or-create-org";
import { findOrCreateOrganization } from "@/services/organizations";
import { getInboxCount } from "@/services/appeals";
import { hasAdminRole } from "@/services/auth";
import { env } from "@/lib/env";
import { auth } from "@/lib/auth"
import { headers } from "next/headers";

export default async function Layout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  var orgId = session?.session.activeOrganizationId
  console.log(orgId)

  if (!orgId)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganizationList />
      </div>
    );

  const organization = await findOrCreateOrganization(orgId);
  const inboxCount = await getInboxCount(orgId);
  const isAdmin = await hasAdminRole();
  return (
    <>
      <DynamicLayout
        organization={organization}
        inboxCount={inboxCount}
        showSubscription={isAdmin && env.ENABLE_BILLING}
      >
        {children}
      </DynamicLayout>
      {sheet}
    </>
  );
}
