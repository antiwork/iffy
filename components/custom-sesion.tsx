import { headers } from "next/headers";
import type { PropsWithChildren } from "react";

import { auth } from "@/lib/auth";


export async function CustomSignedOut({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return <>{children}</>;
  }

  return null;
}


export async function CustomSignedIn({ children }: PropsWithChildren) {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (session) {
    return <>{children}</>;
  }

  return null;
}
