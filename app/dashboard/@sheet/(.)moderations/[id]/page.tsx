import { auth } from "@clerk/nextjs/server";
import { ModerationDetail } from "@/app/dashboard/moderations/[id]/moderation";
import { redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  return {
    title: `Moderation | Iffy`,
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return (
    <RouterSheet title="Moderation">
      <ModerationDetail clerkOrganizationId={orgId} id={params.id} />
    </RouterSheet>
  );
}
