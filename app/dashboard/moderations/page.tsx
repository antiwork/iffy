import { auth } from "@clerk/nextjs/server";
import DataTable from "./data-table";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moderations | Iffy",
};

const Moderations = async () => {
  const { orgId } = await auth();
  if (!orgId) {
    redirect("/");
  }

  return <DataTable clerkOrganizationId={orgId} />;
};

export default Moderations;
