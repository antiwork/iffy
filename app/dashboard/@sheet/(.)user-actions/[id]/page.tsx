import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import { Metadata } from "next";
import { UserActionDetail } from "@/app/dashboard/user-actions/[id]/user-action";

export async function generateMetadata(): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  return {
    title: `User Action | Iffy`,
  };
}

export default async function Page({ params }: { params: { id: string } }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return (
    <RouterSheet title="User Action">
      <UserActionDetail clerkOrganizationId={orgId} id={params.id} />
    </RouterSheet>
  );
}
