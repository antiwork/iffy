import { z } from "zod";

export const CreateAppealRequestData = z
  .object({
    text: z.string(),
  })
  .strict();

export type CreateAppealRequestData = z.infer<typeof CreateAppealRequestData>;
