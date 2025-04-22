import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserActionDetail } from "@/app/dashboard/users/[userId]/actions/[actionId]/user-action";
import { notFound } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatUserRecord } from "@/lib/user-record";

export async function generateMetadata({ params }: { params: Promise<{ actionId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).actionId;

  const userAction = await db.query.userActions.findFirst({
    where: and(eq(schema.userActions.organizationId, orgId), eq(schema.userActions.id, id)),
    with: {
      userRecord: true,
    },
  });

  if (!userAction || !userAction.userRecord) {
    return notFound();
  }

  return {
    title: `${formatUserRecord(userAction.userRecord)} | User action | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ actionId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).actionId;

  return (
    <RouterSheet title="User action">
      <UserActionDetail organizationId={orgId} id={id} />
    </RouterSheet>
  );
}
