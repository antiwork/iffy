import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { notFound, redirect } from "next/navigation";
import { Appeals } from "./appeals";
import { findOrCreateOrganization } from "@/services/organizations";

const InboxLayout = async ({ children }: { children: React.ReactNode }) => {
  const { orgId } = await authWithOrgSubscription();

  const organization = await findOrCreateOrganization(orgId);
  if (!organization.appealsEnabled) {
    return notFound();
  }

  return <Appeals organizationId={orgId}>{children}</Appeals>;
};

export default InboxLayout;
