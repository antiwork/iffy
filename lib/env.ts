import { z } from "zod";

const resendSchema = z.object({
  RESEND_API_KEY: z.string(),
  RESEND_FROM_NAME: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
});

const noResendSchema = z.object({
  RESEND_API_KEY: z.undefined(),
  RESEND_FROM_NAME: z.undefined(),
  RESEND_FROM_EMAIL: z.undefined(),
});

const resendOrNoResendSchema = resendSchema.or(noResendSchema);

const envSchema = z
  .object({
    OPENAI_API_KEY: z.string(),
    FIELD_ENCRYPTION_KEY: z.string(),
    APPEAL_ENCRYPTION_KEY: z.string().optional(),
    SECRET_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.literal("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.literal("/sign-up"),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.literal("/dashboard"),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.literal("/dashboard"),
    SEED_CLERK_ORGANIZATION_ID: z.string().optional(),
    STRIPE_API_KEY: z.string(),
    POSTGRES_URL: z.string(),
    POSTGRES_URL_NON_POOLING: z.string(),
    INNGEST_APP_NAME: z.string(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    ENABLE_PUBLIC_SIGNUP: z
      .enum(["true", "false"])
      .transform((s) => s === "true")
      .optional()
      .default("false"),
  })
  .and(resendOrNoResendSchema);

export const env = Object.freeze(envSchema.parse(process.env));
