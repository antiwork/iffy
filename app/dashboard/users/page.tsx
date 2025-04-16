import { authWithOrgSubscription } from "@/app/dashboard/auth";
import DataTable from "./data-table";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Users | Iffy",
};

const Users = async () => {
  const { orgId } = await authWithOrgSubscription();

  return <DataTable organizationId={orgId} />;
};

export default Users;
