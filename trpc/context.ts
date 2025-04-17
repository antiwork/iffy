import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const createContext = async () => {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  return {
    authOrganizationId: session?.session.activeOrganizationId,
    authUserId: session?.session.userId,
  };
};

export type Context = typeof createContext;
