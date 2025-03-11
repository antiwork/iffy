import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";
import { Appeals } from "./appeals";
import { findOrCreateOrganization } from "@/services/organizations";

const InboxLayout = async ({ children }: { children: React.ReactNode }) => {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const organization = await findOrCreateOrganization(orgId);
  if (!organization.appealsEnabled) {
    return notFound();
  }

  return <Appeals clerkOrganizationId={orgId}>{children}</Appeals>;
};

export default InboxLayout;
