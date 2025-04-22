import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserRecordDetail } from "@/app/dashboard/users/[userId]/user-record";
import { notFound, redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import { formatUserRecordCompact } from "@/lib/user-record";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ userId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userId;

  const userRecord = await db.query.userRecords.findFirst({
    where: and(eq(schema.userRecords.organizationId, orgId), eq(schema.userRecords.id, id)),
  });

  if (!userRecord) {
    return notFound();
  }

  return {
    title: `User ${formatUserRecordCompact(userRecord)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ userId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userId;
  return (
    <RouterSheet title="User">
      <UserRecordDetail organizationId={orgId} id={id} />
    </RouterSheet>
  );
}
