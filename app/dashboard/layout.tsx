import { auth } from "@clerk/nextjs/server";
import DynamicLayout from "./dynamic-layout";
import { OrganizationList } from "@clerk/nextjs";
import { findOrCreateOrganization } from "@/services/organizations";
import { getInboxCount } from "@/services/appeals";

export default async function Layout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  const { orgId } = await auth();

  if (!orgId)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganizationList hidePersonal={true} skipInvitationScreen={true} />
      </div>
    );

  const organization = await findOrCreateOrganization(orgId);
  const inboxCount = await getInboxCount(orgId);

  return (
    <>
      <DynamicLayout organization={organization} inboxCount={inboxCount}>
        {children}
      </DynamicLayout>
      {sheet}
    </>
  );
}
