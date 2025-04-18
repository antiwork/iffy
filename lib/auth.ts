import { betterAuth, BetterAuthOptions } from "better-auth";
import { customSession, magicLink, organization } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db, { schema } from "@/db";
import { env } from "./env";
import { and, eq } from "drizzle-orm";
import { members } from "@/db/tables";
import { Resend } from "resend";

const options = {
  appName: "Iffy",
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
  plugins: [
    organization(),
    magicLink({
      async sendMagicLink({ email, token, url }, request) {
        const resend = new Resend(env.RESEND_API_KEY);

        if (!email) {
          throw new Error("User has no email");
        }

        if (env.NODE_ENV !== "production" && !email.endsWith("@resend.dev")) {
          console.log("Your Magic Link: ", url);
          return;
        }

        const fromEmail = `${env.RESEND_FROM_NAME} <${env.RESEND_FROM_EMAIL}>`;

        const { data, error } = await resend.emails.send({
          from: fromEmail,
          to: [email],
          subject: "Sign into Iffy with your Magic Link",
          html: `
      <p>Hello,</p>
      <p>Click the button below to sign into Iffy:</p>
      <p><a href="${url}" style="padding:10px 20px; background:#4f46e5; color:#fff; text-decoration:none; border-radius:5px;">Sign In</a></p>
      <p>If the button doesn't work, you can also click or copy and paste this URL into your browser:</p>
      <p>${url}</p>
    `,
          text: `Hello,\n\nSign into Iffy using the following link:\n\n${url}`,
        });

        if (error) {
          console.error("Error sending magic link:", error);
          throw new Error("Failed to send magic link email");
        }
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
