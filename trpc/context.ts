import { auth } from "@/services/auth";

export const createContext = async () => {
  const { userId, orgId: organizationId } = await auth();

  return {
    organizationId,
    userId,
  };
};

export type Context = typeof createContext;
