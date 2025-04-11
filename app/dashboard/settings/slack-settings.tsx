"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getAbsoluteUrl } from "@/lib/url";

type SlackSettingsProps = {
  initialSettings: {
    slackEnabled: boolean;
    slackTeamId?: string | null;
    slackTeamName?: string | null;
  };
};

const buildSlackAuthUrl = () => {
  const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
  if (!clientId) {
    throw new Error("NEXT_PUBLIC_SLACK_CLIENT_ID is not defined in next.config.mjs environment variables.");
  }

  let baseUrl = getAbsoluteUrl();

  // if we're running in a local dev environment, use the proxy URL instead
  // this is useful for testing the Slack integration locally
  if (baseUrl.includes("localhost") && process.env.NEXT_PUBLIC_LOCAL_HOST_PROXY_URL) {
    // `env` is not available on the client but we expose this via next.config.mjs so use process.env
    baseUrl = process.env.NEXT_PUBLIC_LOCAL_HOST_PROXY_URL;
  }

  // redirect back to the dashboard settings page after auth which handles code exchange
  const redirectUri = `${baseUrl}/dashboard/settings`;
  // these are the base permissions we need for v1
  const scopes = ["incoming-webhook", "channels:read", "chat:write", "app_mentions:read"];

  return `https://slack.com/oauth/v2/authorize?scope=${scopes.join(",")}&redirect_uri=${redirectUri}&client_id=${clientId}`;
};

export const SlackSettings = ({ initialSettings }: SlackSettingsProps) => {
  const [slackEnabled, setSlackEnabled] = useState(initialSettings.slackEnabled);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    // the callback will handle resetting the state
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    // todo: implement disconnect logic?
  };

  // let's clear the search params if it succeeded on the server after the redirect
  useEffect(() => {
    const url = new URL(window.location.href);
    if (!url.searchParams.has("code")) return;
    url.searchParams.delete("code");
    window.history.replaceState({}, document.title, url.toString());
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Slack Integration</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Connect Iffy to your Slack workspace to manage users directly from Slack.
        </p>
      </div>

      {slackEnabled ? (
        <div className="space-y-4">
          <div className="rounded-md bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Slack integration is active</h3>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p>
                    Connected to workspace: <strong>{initialSettings.slackTeamName || "Unknown workspace"}</strong>
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4">
            <h3 className="mb-2 font-medium">Available commands:</h3>
            <div className="rounded-md bg-gray-50 p-4 font-mono text-sm dark:bg-gray-800">
              <p className="mb-2">
                <code>@iffy suspend user_id1, user_id2 because reason</code> - Suspend one or more users
              </p>
              <p className="mb-2">
                <code>@iffy unsuspend user_id1, user_id2</code> - Unsuspend users
              </p>
              <p className="mb-2">
                <code>@iffy info user_id</code> - Get user details
              </p>
            </div>
          </div>

          {/* <Button variant="destructive" onClick={handleDisconnect} disabled={isDisconnecting} className="mt-4">
            {isDisconnecting ? "Disconnecting..." : "Disconnect Slack"}
          </Button> */}
        </div>
      ) : (
        <div className="space-y-4">
          <Link href={buildSlackAuthUrl()} rel="noopener noreferrer" target="_blank">
            <Button onClick={handleConnect} disabled={isConnecting} className="mt-2">
              {isConnecting ? "Connecting..." : "Connect Slack Workspace"}
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
};
