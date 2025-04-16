import { customSessionClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization, useListOrganizations } =
  createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL,
    plugins: [organizationClient(), customSessionClient<typeof auth>()],
  });
