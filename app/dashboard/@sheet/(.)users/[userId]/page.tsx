import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserDetail } from "@/app/dashboard/users/[userId]/user";
import { notFound, redirect } from "next/navigation";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import { formatUserRecordCompact } from "@/lib/user-record";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ userRecordId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userRecordId;

  const userRecord = await db.query.userRecords.findFirst({
    where: and(eq(schema.userRecords.clerkOrganizationId, orgId), eq(schema.userRecords.id, id)),
  });

  if (!userRecord) {
    return notFound();
  }

  return {
    title: `User ${formatUserRecordCompact(userRecord)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ userRecordId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).userRecordId;
  return (
    <RouterSheet title="User">
      <UserDetail clerkOrganizationId={orgId} id={id} />
    </RouterSheet>
  );
}
