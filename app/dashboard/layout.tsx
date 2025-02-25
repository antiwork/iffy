import { auth } from "@clerk/nextjs/server";
import DynamicLayout from "./dynamic-layout";
import { OrganizationList } from "@clerk/nextjs";
import { findOrCreateOrganizationSettings } from "@/services/organization-settings";
import { getInboxCount } from "@/services/appeals";
import { getTrialSubscription } from "@/services/subscriptions";

export default async function Layout({ children, sheet }: { children: React.ReactNode; sheet: React.ReactNode }) {
  const { orgId } = await auth();

  if (!orgId)
    return (
      <div className="flex h-screen items-center justify-center">
        <OrganizationList hidePersonal={true} skipInvitationScreen={true} />
      </div>
    );

  const organizationSettings = await findOrCreateOrganizationSettings(orgId);
  const inboxCount = await getInboxCount(orgId);
  const trialSubscription = await getTrialSubscription(orgId);

  return (
    <>
      <DynamicLayout
        organizationSettings={organizationSettings}
        inboxCount={inboxCount}
        trialSubscription={trialSubscription}
      >
        {children}
      </DynamicLayout>
      {sheet}
    </>
  );
}
