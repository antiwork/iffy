"use server";

import { createSafeActionClient } from "next-safe-action";
import { z } from "zod";
import { submitAppealSchema } from "./validation";
import { createAppeal, validateAppealToken } from "@/services/appeals";
import { revalidatePath } from "next/cache";

const appealActionClient = createSafeActionClient();

export const submitAppeal = appealActionClient
  .schema(submitAppealSchema)
  .bindArgsSchemas<[token: z.ZodString]>([z.string()])
  .action(async ({ parsedInput: { text }, bindArgsParsedInputs: [token] }) => {
    const [isValid, userRecordId] = await validateAppealToken(token);
    if (!isValid) {
      throw new Error("Invalid appeal token");
    }
    const appeal = await createAppeal({ userRecordId, text });
    revalidatePath("/appeal");
    return { appeal };
  });
