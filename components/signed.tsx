import { auth } from "@/services/auth";

export async function SignedIn({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session.sessionId) return <></>;
  return <>{children}</>;
}

export async function SignedOut({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (session.sessionId) return <></>;
  return <>{children}</>;
}
