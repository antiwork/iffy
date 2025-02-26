import { redirect } from "next/navigation";
import { RecordDetail } from "@/app/dashboard/records/[recordId]/record";
import { auth } from "@clerk/nextjs/server";
import { RouterSheet } from "@/components/router-sheet";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ recordId: string }> }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  const id = (await params).recordId;

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, orgId), eq(schema.records.id, id)),
  });

  if (!record) {
    return notFound();
  }

  return {
    title: `Record ${record.name} (${record.entity}) | Iffy`,
  };
}

export default async function Page({ params }: { params: Promise<{ recordId: string }> }) {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  const id = (await params).recordId;
  return (
    <RouterSheet title="Record">
      <RecordDetail clerkOrganizationId={orgId} id={id} isModal={true} />
    </RouterSheet>
  );
}
