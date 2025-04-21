import { notFound } from "next/navigation";
import { RecordDetail } from "./record";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { formatRecord } from "@/lib/record";

export async function generateMetadata({ params }: { params: Promise<{ recordId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).recordId;

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, orgId), eq(schema.records.id, id)),
  });

  if (!record) {
    return notFound();
  }

  return {
    title: `${formatRecord(record)} (${record.entity}) | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ recordId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).recordId;
  return <RecordDetail clerkOrganizationId={orgId} id={id} />;
}
