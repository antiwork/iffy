import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { ModerationDetail } from "./moderation";

export const metadata: Metadata = {
  title: "Moderation | Iffy",
};

export default async function ModerationPage({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return <ModerationDetail clerkOrganizationId={orgId} id={params.id} />;
} 