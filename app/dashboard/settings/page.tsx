import { findOrCreateOrganization } from "@/services/organizations";
import { Settings } from "./settings";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | Iffy",
};

export default async function SettingsPage() {
  const { orgId } = await authWithOrgSubscription();
  const organization = await findOrCreateOrganization({ id: orgId });

  return (
    <div className="px-12 py-8">
      <div className="text-gray-950 dark:text-stone-50">
        <h2 className="mb-6 text-2xl font-bold">Settings</h2>
        <div className="space-y-8">
          <Settings organization={organization} />
        </div>
      </div>
    </div>
  );
}
