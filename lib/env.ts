import { z } from "zod";

const resendEmailSchema = z.object({
  RESEND_API_KEY: z.string(),
  RESEND_FROM_NAME: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_AUDIENCE_ID: z.undefined(),
  CLERK_WEBHOOK_SECRET: z.undefined(),
});

const resendAudienceSchema = z.object({
  RESEND_API_KEY: z.string(),
  RESEND_AUDIENCE_ID: z.string(),
  RESEND_FROM_NAME: z.undefined(),
  RESEND_FROM_EMAIL: z.undefined(),
  CLERK_WEBHOOK_SECRET: z.string(),
});

const resendFullSchema = z.object({
  RESEND_API_KEY: z.string(),
  RESEND_FROM_NAME: z.string(),
  RESEND_FROM_EMAIL: z.string().email(),
  RESEND_AUDIENCE_ID: z.string(),
  CLERK_WEBHOOK_SECRET: z.string(),
});

const noResendSchema = z.object({
  RESEND_API_KEY: z.undefined(),
  RESEND_FROM_NAME: z.undefined(),
  RESEND_FROM_EMAIL: z.undefined(),
  RESEND_AUDIENCE_ID: z.undefined(),
  CLERK_WEBHOOK_SECRET: z.undefined(),
});

const resendOrNoResendSchema = resendEmailSchema.or(resendAudienceSchema).or(resendFullSchema).or(noResendSchema);

const envSchema = z
  .object({
    OPENAI_API_KEY: z.string(),
    FIELD_ENCRYPTION_KEY: z.string(),
    SECRET_KEY: z.string(),
    CLERK_SECRET_KEY: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.literal("/sign-in"),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.literal("/sign-up"),
    NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL: z.literal("/dashboard"),
    NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL: z.literal("/dashboard"),
    SEED_CLERK_ORGANIZATION_ID: z.string().optional(),
    STRIPE_API_KEY: z.string().optional(),
    POSTGRES_URL: z.string(),
    POSTGRES_URL_NON_POOLING: z.string(),
    INNGEST_APP_NAME: z.string(),
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    ENABLE_PUBLIC_SIGNUP: z
      .enum(["true", "false"])
      .transform((s) => s === "true")
      .optional()
      .default("false"),
    ENABLE_BILLING: z
      .enum(["true", "false"])
      .transform((s) => s === "true")
      .optional()
      .default("false"),
    NEXT_PUBLIC_BETTER_AUTH_URL: z.string(),
    BETTER_AUTH_GOOGLE_CLIENT_ID: z.string().default(""),
    BETTER_AUTH_GOOGLE_CLIENT_SECRET: z.string().default(""),
  })
  .and(resendOrNoResendSchema);

export const env = Object.freeze(envSchema.parse(process.env));
