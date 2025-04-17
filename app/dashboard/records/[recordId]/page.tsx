import { notFound, redirect } from "next/navigation";
import { RecordDetail } from "./record";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";

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
    title: `${record.name} (${record.entity}) | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ recordId: string }> }) {
  const { orgId } = await authWithOrgSubscription();

  const id = (await params).recordId;
  return <RecordDetail authOrganizationId={orgId} id={id} />;
}
