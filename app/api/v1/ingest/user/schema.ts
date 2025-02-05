import { z } from "zod";

export const IngestUserRequestData = z
  .object({
    clientId: z.string(),
    clientUrl: z.string().url().optional(),
    name: z.string().optional(),
    username: z.string().optional(),
    email: z.string().optional(),
    stripeAccountId: z.string().optional(),
    protected: z.boolean().optional(),
  })
  .strict();

export type IngestUserRequestData = z.infer<typeof IngestUserRequestData>;
