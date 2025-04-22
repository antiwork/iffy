import { customSessionClient, magicLinkClient, organizationClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const { signIn, signUp, signOut, useSession, organization, useActiveOrganization, useListOrganizations } =
  createAuthClient({
    plugins: [organizationClient(), customSessionClient<typeof auth>(), magicLinkClient()],
  });
