import { EventSchemas, GetEvents, Inngest } from "inngest";
import { z } from "zod";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const eventsMap = {
  "record/deleted": {
    data: z.object({ organizationId: z.string(), id: z.string() }),
  },
  "moderation/moderated": {
    data: z.object({ organizationId: z.string(), moderationId: z.string(), recordId: z.string() }),
  },
  "moderation/usage": {
    data: z.object({ organizationId: z.string(), id: z.string(), recordId: z.string() }),
  },
  "moderation/status-changed": {
    data: z.object({
      organizationId: z.string(),
      id: z.string(),
      recordId: z.string(),
      status: z.enum(schema.moderationStatus.enumValues),
      lastStatus: z.enum(schema.moderationStatus.enumValues).nullable(),
    }),
  },
  "user-action/status-changed": {
    data: z.object({
      organizationId: z.string(),
      id: z.string(),
      userId: z.string(),
      status: z.enum(schema.userActionStatus.enumValues),
      lastStatus: z.enum(schema.userActionStatus.enumValues).nullable(),
    }),
  },
  "appeal-action/status-changed": {
    data: z.object({
      organizationId: z.string(),
      id: z.string(),
      appealId: z.string(),
      status: z.enum(schema.appealActionStatus.enumValues),
      lastStatus: z.enum(schema.appealActionStatus.enumValues).nullable(),
    }),
  },
  "clerk/user.created": {
    data: z.object({
      object: z.literal("user"),
      id: z.string(),
      username: z.string().nullable(),
      first_name: z.string().nullable(),
      last_name: z.string().nullable(),
      primary_email_address_id: z.string().nullable(),
      email_addresses: z.array(
        z.object({
          object: z.literal("email_address"),
          id: z.string(),
          email_address: z.string(),
        }),
      ),
      organization_memberships: z
        .array(
          z.object({
            object: z.literal("organization_membership"),
            id: z.string(),
            role: z.string(),
            organization: z.object({
              object: z.literal("organization"),
              id: z.string(),
              name: z.string(),
              slug: z.string(),
            }),
          }),
        )
        .nullable(),
      created_at: z.number(),
      updated_at: z.number(),
    }),
  },
};

export const inngest = new Inngest({
  id: env.INNGEST_APP_NAME,
  schemas: new EventSchemas().fromZod(eventsMap),
});

export type Events = GetEvents<typeof inngest>;
