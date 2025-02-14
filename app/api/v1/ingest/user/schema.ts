import { isValidMetadata } from "@/services/metadata";
import { z } from "zod";

const MetadataSchema = z.record(z.string(), z.unknown()).refine(isValidMetadata, {
  message:
    "Metadata keys can't be more than 40 characters or include '[' or ']'. Metadata values must be serializable and can't be more than 500 characters. The total number of keys can't be more than 50.",
});

export const IngestUserRequestData = z
  .object({
    clientId: z.string(),
    clientUrl: z.string().url().optional(),
    stripeAccountId: z.string().optional(),
    email: z.string().optional(),
    name: z.string().optional(),
    username: z.string().optional(),
    protected: z.boolean().optional(),
    metadata: MetadataSchema.optional(),
  })
  .strict();

export type IngestUserRequestData = z.infer<typeof IngestUserRequestData>;
