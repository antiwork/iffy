"use client";

import { useSession } from "@/lib/auth-client";

interface BetterAuthLoadingInput {
  children: React.ReactNode;
}

const BetterAuthLoading = ({ children }: BetterAuthLoadingInput) => {
  const { isPending } = useSession();
  if (isPending) return <>{children}</>;
  return <></>;
};

interface BetterAuthLoadedInput {
  children: React.ReactNode;
}

const BetterAuthLoaded = ({ children }: BetterAuthLoadedInput) => {
  const { isPending } = useSession();
  if (!isPending) return <>{children}</>;
  return <></>;
};

export { BetterAuthLoading, BetterAuthLoaded };
