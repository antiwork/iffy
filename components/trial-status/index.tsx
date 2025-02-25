import { useState } from "react";
import { AlertCircle } from "lucide-react";
import { UpgradeModal } from "./upgrade-modal";
import { Subscription } from "@/lib/types";

interface TrialStatusProps {
  isCollapsed?: boolean;
  activeSubscription: Subscription | null;
}

export function TrialStatus({ isCollapsed, activeSubscription }: TrialStatusProps) {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (isCollapsed) return null;
  return (
    <div className="mt-auto border-t border-green-900/10 p-4">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-[oklch(0.627_0.194_149.214)]" />
            <span className="text-sm font-medium text-green-950/85 dark:text-green-300">
              {activeSubscription ? "Trial active" : "Trial ended"}
            </span>
          </div>
          <span className="text-xs text-green-950/60 dark:text-green-300/60">
            {activeSubscription?.plan ? `Plan: ${activeSubscription?.plan}` : `Trial expired`}
          </span>
        </div>

        <div className="text-sm text-green-950/70 dark:text-green-300/70">
          {activeSubscription?.trialModerationsRemaining ?? "0"} moderations remaining
        </div>

        <button
          onClick={() => setShowUpgradeModal(true)}
          className="w-full rounded-md bg-[oklch(0.627_0.194_149.214)] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.597_0.194_149.214)]"
        >
          Upgrade
        </button>
      </div>

      <UpgradeModal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} />
    </div>
  );
}
