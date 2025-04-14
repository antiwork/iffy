import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { getActiveOrganization } from "./auth-helper"
import db from "@/db";

const authOptions = {
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [organization(), nextCookies()],
  databaseHooks: {
    session: {
      create: {
        before: async (session) => {
          const org = await getActiveOrganization(session.userId);
          return {
            data: {
              ...session,
              OrganizationId: org.id,
            },
          };
        },
      },
    },
  },
};

export const auth = betterAuth(authOptions);
