import { createAuthClient } from "better-auth/react"
import { organizationClient, magicLinkClient, emailOTPClient } from "better-auth/client/plugins"

export const { signIn, signUp, signOut, useSession, emailOtp } = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    organizationClient(),
    magicLinkClient(),
    emailOTPClient(),
  ],
})
