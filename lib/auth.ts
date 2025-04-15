import { betterAuth, BetterAuthOptions } from "better-auth";
import { customSession, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db, { schema } from "@/db";
import { env } from "./env";
import { and, eq } from "drizzle-orm";
import { members } from "@/db/tables";

const options = {
  appName: env.INNGEST_APP_NAME,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: env.BETTER_AUTH_GOOGLE_CLIENT_ID,
      clientSecret: env.BETTER_AUTH_GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [organization()],
} satisfies BetterAuthOptions;

export const auth = betterAuth({
  ...options,
  plugins: [
    ...(options.plugins ?? []),
    customSession(async ({ user, session }) => {
      const { activeOrganizationId } = session;

      if (!activeOrganizationId) return { user, session };

      const member = await db.query.members.findFirst({
        where: and(eq(members.userId, user.id), eq(members.organizationId, activeOrganizationId)),
        with: {
          organization: true,
        },
      });

      if (!member) return { user, session };

      return {
        user,
        session: {
          ...session,
          activeOrganizationRole: member.role,
          activeOrganizationSlug: member.organization.slug,
        },
      };
    }, options),
  ],
});

export type Session = {
  session: typeof auth.$Infer.Session.session & { activeOrganizationRole: string; activeOrganizationSlug: string };
  user: typeof auth.$Infer.Session.user;
};
