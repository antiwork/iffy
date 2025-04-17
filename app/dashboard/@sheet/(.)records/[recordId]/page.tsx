import { redirect } from "next/navigation";
import { RecordDetail } from "@/app/dashboard/records/[recordId]/record";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { authWithOrgSubscription } from "@/app/dashboard/auth";

export async function generateMetadata({ params }: { params: Promise<{ recordId: string }> }): Promise<Metadata> {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).recordId;

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.authOrganizationId, orgId), eq(schema.records.id, id)),
  });

  if (!record) {
    return notFound();
  }

  return {
    title: `Record ${record.name} (${record.entity}) | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ recordId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).recordId;
  return (
    <RouterSheet title="Record">
      <RecordDetail authOrganizationId={orgId} id={id} />
    </RouterSheet>
  );
}
