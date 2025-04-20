"use client";

import { useSession } from "@/lib/auth-client";

interface BetterAuthLoadingInput {
  children: React.ReactNode;
}

export const BetterAuthLoading = ({ children }: BetterAuthLoadingInput) => {
  const { isPending } = useSession();
  if (isPending) return <>{children}</>;
  return <></>;
};
