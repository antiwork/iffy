import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { organization as authPluginOrg, magicLink, emailOTP } from "better-auth/plugins";
import { organization, user, session, account, verification, member, invitation } from "@/db/auth-schema"
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import db from "@/db";
import { sendVerificationOTP, sendInvitation } from "@/services/email"


const emailAuthConfig = emailOTP({
  sendVerificationOnSignUp: true,
  async sendVerificationOTP({ email, otp, type }) {
    await sendVerificationOTP({ email, otp, type })
  }
})

const organizationAuthConfig = authPluginOrg({
  async sendInvitationEmail(data) {
    const inviteLink = `https://localhost:3000/api/invitations`
    sendInvitation({
      email: data.email,
      inviterName: data.inviter.user.name,
      organizationName: data.organization.name,
      inviteLink,
      invitationId: data.id
    }
    )
  }
})

const nextCookiesAuthConfig = nextCookies()

const authOptions = {
  emailAndPassword: {
    enabled: true
  },
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      organization: organization,
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
  plugins: [organizationAuthConfig, emailAuthConfig, nextCookiesAuthConfig],
};


export const auth = betterAuth(authOptions);
