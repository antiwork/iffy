import { createAuthClient } from "better-auth/react"
import { organizationClient, emailOTPClient } from "better-auth/client/plugins"

export const client = createAuthClient({
  baseURL: "http://localhost:3000",
  plugins: [
    organizationClient(),
    emailOTPClient(),
  ],
})
