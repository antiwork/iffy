import { findOrCreateOrganization, findSlackInboxes } from "@/services/organizations";
import { Settings } from "./settings";
import { authWithOrgSubscription } from "@/app/dashboard/auth";
import { Metadata } from "next";
import { getAbsoluteUrl } from "@/lib/url";

export const metadata: Metadata = {
  title: "Settings | Iffy",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const { orgId } = await authWithOrgSubscription();
  const organization = await findOrCreateOrganization(orgId);
  const slackInboxes = await findSlackInboxes(organization.clerkOrganizationId);

  try {
    const { code } = await searchParams;
    if (code) {
      const oauthResponse = await fetch(`${getAbsoluteUrl()}/api/v1/slack/oauth/callback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ code, clerkOrganizationId: organization.clerkOrganizationId }),
      });

      if (!oauthResponse.ok) {
        throw new Error("Failed to authenticate with Slack", { cause: oauthResponse.statusText });
      }

      const oauthData = await oauthResponse.json();

      if (!oauthData.success) {
        throw new Error("Failed to authenticate with Slack");
      }
    }
  } catch (e) {
    console.error("Error parsing search params:", e);
  }

  return (
    <div className="px-12 py-8">
      <div className="text-gray-950 dark:text-stone-50">
        <h2 className="mb-6 text-2xl font-bold">Settings</h2>
        <div className="space-y-8">
          <Settings organization={organization} inboxes={slackInboxes} />
        </div>
      </div>
    </div>
  );
}
