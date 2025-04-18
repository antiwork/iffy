import { authWithOrgSubscription } from "@/app/dashboard/auth";
import DataTable from "./data-table";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Moderations | Iffy",
};

const Moderations = async () => {
  const { orgId } = await authWithOrgSubscription();

  return <DataTable organizationId={orgId} />;
};

export default Moderations;
