"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { revalidatePath } from "next/cache";
import db from "@/db";
import * as schema from "@/db/schema";
import { updateEmailTemplateSchema } from "./schema";
import { validateContent } from "@/emails/render";

export const updateEmailTemplate = actionClient
  .schema(updateEmailTemplateSchema)
  .bindArgsSchemas([z.enum(schema.emailTemplateType.enumValues)])
  .action(
    async ({ parsedInput: { subject, heading, body }, bindArgsParsedInputs: [type], ctx: { organizationId } }) => {
      validateContent({ subject, heading, body });

      const [emailTemplate] = await db
        .insert(schema.emailTemplates)
        .values({
          organizationId,
          type,
          content: { subject, heading, body },
        })
        .onConflictDoUpdate({
          target: [schema.emailTemplates.authOrganizationId, schema.emailTemplates.type],
          set: {
            content: { subject, heading, body },
          },
        })
        .returning();

      revalidatePath("/dashboard/emails");
      return emailTemplate;
    },
  );
