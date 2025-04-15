import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function SignedIn({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return <></>;
  return <>{children}</>;
}

export async function SignedOut({ children }: { children: React.ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session) return <></>;
  return <>{children}</>;
}
