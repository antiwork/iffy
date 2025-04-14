import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserDetail } from "@/app/dashboard/users/[userId]/user";
import { notFound, redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import { formatUserCompact } from "@/lib/user";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userId;

  const user = await db.query.endUsers.findFirst({
    where: and(eq(schema.endUsers.organizationId, orgId), eq(schema.endUsers.id, id)),
  });

  if (!user) {
    return notFound();
  }

  return {
    title: `User ${formatUserCompact(user)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userId;
  return (
    <RouterSheet title="User">
      <UserDetail organizationId={orgId} id={id} />
    </RouterSheet>
  );
}
