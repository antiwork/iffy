import { redirect } from "next/navigation";
import { RecordDetail } from "./record";
import { auth } from "@clerk/nextjs/server";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    return {
      title: "Record | Iffy",
    };
  }

  const record = await db.query.records.findFirst({
    where: and(eq(schema.records.clerkOrganizationId, orgId), eq(schema.records.id, params.id)),
  });

  if (!record) {
    return {
      title: "Record Not Found | Iffy",
    };
  }

  return {
    title: `Record #${record.id} | Iffy`,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  return <RecordDetail clerkOrganizationId={orgId} id={params.id} />;
}
