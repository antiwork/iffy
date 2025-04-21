import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { UserDetail } from "./user";
import { notFound, redirect } from "next/navigation";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatUserRecordCompact } from "@/lib/user-record";

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
    title: `${formatUserRecordCompact(userRecord)} | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ userRecordId: string }> }) {
  const { orgId } = await authWithOrgSubscription();
  const id = (await params).userRecordId;
  return <UserDetail clerkOrganizationId={orgId} id={id} />;
}
