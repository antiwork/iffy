"use client";

import * as React from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { updateOrganizationSettings } from "../developer/actions";

export const Settings = ({
  organizationSettings: initialOrganizationSettings,
}: {
  organizationSettings: {
    emailsEnabled: boolean;
    appealsEnabled: boolean;
    testModeEnabled: boolean;
    moderationPercentage: number;
  };
}) => {
  const [emailsEnabled, setEmailsEnabled] = React.useState(initialOrganizationSettings.emailsEnabled);
  const [appealsEnabled, setAppealsEnabled] = React.useState(initialOrganizationSettings.appealsEnabled);
  const [testModeEnabled, setTestModeEnabled] = React.useState(initialOrganizationSettings.testModeEnabled);
  const [moderationPercentage, setModerationPercentage] = React.useState(
    initialOrganizationSettings.moderationPercentage.toString(),
  );
  const [hasModerationPercentageError, setHasModerationPercentageError] = React.useState(false);

  const handleToggleEmails = async () => {
    try {
      const result = await updateOrganizationSettings({ emailsEnabled: !emailsEnabled });
      if (result?.data) {
        setEmailsEnabled(!emailsEnabled);
      }
    } catch (error) {
      console.error("Error updating emails setting:", error);
    }
  };

  const handleToggleAppeals = async () => {
    try {
      const result = await updateOrganizationSettings({ appealsEnabled: !appealsEnabled });
      if (result?.data) {
        setAppealsEnabled(!appealsEnabled);
      }
    } catch (error) {
      console.error("Error updating appeals setting:", error);
    }
  };

  const handleToggleTestMode = async () => {
    try {
      const result = await updateOrganizationSettings({ testModeEnabled: !testModeEnabled });
      if (result?.data) {
        setTestModeEnabled(!testModeEnabled);
      }
    } catch (error) {
      console.error("Error updating test mode setting:", error);
    }
  };

  const handleModerationPercentageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setModerationPercentage(e.target.value);
  };

  const handleModerationPercentageBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const newPercentage = Number(e.target.value);
    if (newPercentage >= 0 && newPercentage <= 100) {
      try {
        const result = await updateOrganizationSettings({ moderationPercentage: newPercentage });
        if (result?.data) {
          setModerationPercentage(newPercentage.toString());
          setHasModerationPercentageError(false);
        }
      } catch (error) {
        console.error("Error updating moderation percentage:", error);
        setHasModerationPercentageError(true);
      }
    } else {
      setHasModerationPercentageError(true);
    }
  };

  return (
    <div className="text-gray-950 dark:text-stone-50">
      <h2 className="mb-6 text-2xl font-bold">Settings</h2>
      <div className="space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>Enable emails</span>
            <Switch checked={emailsEnabled} onCheckedChange={handleToggleEmails} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send email notifications to users when they are suspended
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>Enable appeals</span>
            <Switch checked={appealsEnabled} onCheckedChange={handleToggleAppeals} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Allow users to appeal suspensions and send messages to an Iffy appeals inbox
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span>Enable test mode</span>
            <Switch checked={testModeEnabled} onCheckedChange={handleToggleTestMode} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moderate content in test mode without triggering user actions like suspensions or bans
          </p>
        </div>
        <div>
          <label
            htmlFor="moderationPercentage"
            className="text-md mb-2 block font-normal text-gray-950 dark:text-stone-50"
          >
            Roll-out percentage
          </label>
          <div className="relative mt-1 rounded-md shadow-xs">
            <Input
              id="moderationPercentage"
              type="number"
              min="0"
              max="100"
              value={moderationPercentage}
              onChange={handleModerationPercentageChange}
              onBlur={handleModerationPercentageBlur}
              className={`pr-8 ${hasModerationPercentageError ? "border-red-500" : ""}`}
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-gray-500 sm:text-sm dark:text-stone-50">%</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Moderate a percentage of ingested records for a gradual roll-out.
          </p>
          {hasModerationPercentageError && <p className="mt-2 text-sm text-red-600">Invalid percentage</p>}
        </div>
      </div>
    </div>
  );
};
