import { findOrCreateOrganization } from "@/services/organizations";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscribe | Iffy",
};

export default async function SubscribePage() {
  const { orgId, userId } = await auth();

  if (!orgId) {
    redirect("/");
  }

  const organization = await findOrCreateOrganization(orgId);

  return <div className="px-12 py-8"></div>;
}
