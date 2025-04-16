import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization, magicLink } from "better-auth/plugins";
import { organizations, user, session, account, verification, member, invitation } from "@/db/tables"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db";
import { sendVerificationOTP } from "@/services/email"


// const emailAuthConfig = emailOTP({
//   sendVerificationOnSignUp: true,
//   async sendVerificationOTP({ email, otp, type }) {
//     await sendVerificationOTP({ email, otp, type })
//   }
// })

const magicLinkAuthConfig = magicLink({
  sendMagicLink: async ({ email, token, url }, request) => {
    await sendVerificationOTP({ email, token, url })
  }
})

const organizationAuthConfig = organization()

const nextCookiesAuthConfig = nextCookies()

const authOptions = {
  emailAndPassword: {
    enabled: true
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      organizations: organizations,
      user: user,
      session: session,
      account: account,
      verification: verification,
      member: member,
      invitation: invitation
    }
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [organizationAuthConfig, magicLinkAuthConfig, nextCookiesAuthConfig],
  // WARN: check this session have orgid without database hook
  // databaseHooks: {
  //   session: {
  //     create: {
  //       before: async (session) => {
  //         const org = await getActiveOrganization(session.userId);
  //         return {
  //           data: {
  //             ...session,
  //             OrganizationId: org.id,
  //           },
  //         };
  //       },
  //     },
  //   },
  // },
};


export const auth = betterAuth(authOptions);
