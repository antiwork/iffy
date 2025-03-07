import { flag } from "flags/next";
import { env } from "@/lib/env";

export const enablePublicSignupFlag = flag({
  key: "enable-public-signup",
  decide: () => env.ENABLE_PUBLIC_SIGNUP,
  defaultValue: false,
  options: [
    {
      label: "Enabled",
      value: true,
    },
    {
      label: "Disabled",
      value: false,
    },
  ],
});
