import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization, emailOTP } from "better-auth/plugins";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db";
import { sendVerificationOTP } from "@/services/email"


const emailAuthConfig = emailOTP({
  sendVerificationOnSignUp: true,
  async sendVerificationOTP({ email, otp, type }) {
    await sendVerificationOTP({ email, otp, type })
  }
})

const organizationAuthConfig = organization({
  schema: {
    organization: {
      modelName: "organizations",  //map the organization table to organizations table
    }
  }
})

const nextCookiesAuthConfig = nextCookies()

const authOptions = {
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  plugins: [organizationAuthConfig, emailAuthConfig, nextCookiesAuthConfig],
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
