import { auth } from "@/services/auth";

export async function SignedIn({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (!userId) return <></>;
  return <>{children}</>;
}

export async function SignedOut({ children }: { children: React.ReactNode }) {
  const { userId } = await auth();
  if (userId) return <></>;
  return <>{children}</>;
}
