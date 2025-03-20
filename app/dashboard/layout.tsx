import DynamicLayout from "./dynamic-layout";
import { OrganizationList } from "@clerk/nextjs";
import { findOrCreateOrganization } from "@/services/organizations";
import { getInboxCount } from "@/services/appeals";
import { auth } from "@clerk/nextjs/server";
import { hasAdminRole } from "@/services/auth";
import { env } from "@/lib/env";

export default async function Layout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  const { orgId } = await auth();

  if (!orgId)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganizationList
          hidePersonal={true}
          skipInvitationScreen={true}
          afterCreateOrganizationUrl="/dashboard"
          afterSelectOrganizationUrl="/dashboard"
        />
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
