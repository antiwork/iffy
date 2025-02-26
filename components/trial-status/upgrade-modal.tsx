import { AlertTriangle } from "lucide-react";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  if (!isOpen) return null;

  const handleContactSupport = () => {
    const subject = encodeURIComponent("Trial Period Ended - Support Request");
    const body = encodeURIComponent(
      "Hi Support Team,\n\nMy trial period has ended, and I need assistance with my subscription. Please advise on the next steps.\n\nThank you.",
    );
    window.location.href = `mailto:support@iffy.com?subject=${subject}&body=${body}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-zinc-900">
        <div className="mb-4 flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-[oklch(0.627_0.194_149.214)]" />
          <h2 className="text-xl font-semibold text-green-950/90 dark:text-white">Trial period ended</h2>
        </div>

        <p className="mb-6 text-green-950/70 dark:text-green-300/70">
          Your free trial has ended. To continue using Iffy, please contact your administrator or support team for
          further instructions. All subscription changes will be handled out-of-band.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={handleContactSupport}
            className="flex-1 rounded-md bg-[oklch(0.627_0.194_149.214)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[oklch(0.597_0.194_149.214)]"
          >
            Contact support
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-md border border-green-900/10 px-4 py-2 text-sm font-medium text-green-950/70 transition-colors hover:bg-green-950/5 dark:border-green-300/20 dark:text-green-300/70 dark:hover:bg-white/5"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
