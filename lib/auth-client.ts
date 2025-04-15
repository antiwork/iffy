import { customSessionClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { auth } from "./auth";

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization, useListOrganizations } =
  createAuthClient({
    baseURL: "http://localhost:3000",
    plugins: [organizationClient(), customSessionClient<typeof auth>()],
  });
