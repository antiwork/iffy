import { auth } from "@clerk/nextjs/server";

export const createContext = async () => {
  const { orgId, userId } = await auth();

  return {
    authOrganizationId: orgId,
    authUserId: userId,
  };
};

export type Context = typeof createContext;
