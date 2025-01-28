import { auth } from "@clerk/nextjs/server";
import { RecordUserDetail } from "./record-user";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import db from "@/db";
import * as schema from "@/db/schema";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const { orgId } = await auth();
  if (!orgId) {
    return {
      title: "User | Iffy",
    };
  }

  const recordUser = await db.query.recordUsers.findFirst({
    where: and(eq(schema.recordUsers.clerkOrganizationId, orgId), eq(schema.recordUsers.id, params.id)),
  });

  if (!recordUser) {
    return {
      title: "User Not Found | Iffy",
    };
  }

  return {
    title: `${recordUser.name || "Unknown User"} | Iffy`,
  };
}

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }
  return <RecordUserDetail clerkOrganizationId={orgId} id={params.id} />;
}
