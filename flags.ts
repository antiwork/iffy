import { flag } from "flags/next"
import { isIffyCloud } from "@/lib/env"

export const signupEnabled = flag({
  key: "feature-signup",
  decide: () => isIffyCloud
})