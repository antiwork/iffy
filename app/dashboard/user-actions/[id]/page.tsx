import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { UserActionDetail } from "./user-action";

export const metadata: Metadata = {
  title: "User action | Iffy",
};

export default async function UserActionPage({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return <UserActionDetail clerkOrganizationId={orgId} id={params.id} />;
} 