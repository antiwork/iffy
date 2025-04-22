import { betterAuth, BetterAuthOptions } from "better-auth";
import { customSession, magicLink, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db, { schema } from "@/db";
import { env } from "./env";
import { and, eq } from "drizzle-orm";
import { members } from "@/db/tables";
import { nextCookies } from "better-auth/next-js";
import { sendTenantEmail } from "@/services/email";
import { render, replacePlaceholders } from "@/emails/render";
import InvitationTemplate from "@/emails/templates/invitation";
import MagicLinkTemplate from "@/emails/templates/magiclink";
import { getAbsoluteUrl } from "./url";

const options = {
  appName: "Iffy",
  secret: env.SECRET_KEY,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
    usePlural: true,
  }),
  emailAndPassword: {
    enabled: true,
  },
  plugins: [
    organization({
      sendInvitationEmail: async ({ email, organization, role, invitation }) => {
        const url = getAbsoluteUrl(`/organization/invite/${invitation.id}`);
        const { html, subject } = await render({
          organizationId: organization.id,
          type: "Invitation",
          joinUrl: url,
          content: await replacePlaceholders(InvitationTemplate.defaultContent, {
            ORGANIZATION_NAME: organization.name,
            ORGANIZATION_ROLE: role,
          }),
        });
        await sendTenantEmail({
          email,
          subject,
          html,
        });
      },
    }),
    nextCookies(),
    magicLink({
      disableSignUp: true,
      sendMagicLink: async ({ email, url }) => {
        const { html, subject } = await render({
          organizationId: "default",
          type: "MagicLink",
          magicLink: url,
          content: MagicLinkTemplate.defaultContent,
        });

        await sendTenantEmail({
          email,
          subject,
          html,
        });
      },
    }),
  ],
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
