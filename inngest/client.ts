import { EventSchemas, GetEvents, Inngest } from "inngest";
import { z } from "zod";
import * as schema from "@/db/schema";
import { env } from "@/lib/env";

const eventsMap = {
  "record/deleted": {
    data: z.object({ clerkOrganizationId: z.string(), id: z.string() }),
  },
  "moderation/moderated": {
    data: z.object({ clerkOrganizationId: z.string(), moderationId: z.string(), recordId: z.string() }),
  },
  "moderation/status-changed": {
    data: z.object({
      clerkOrganizationId: z.string(),
      id: z.string(),
      recordId: z.string(),
      status: z.enum(schema.moderationStatus.enumValues),
      lastStatus: z.enum(schema.moderationStatus.enumValues).nullable(),
    }),
  },
  "user-action/status-changed": {
    data: z.object({
      clerkOrganizationId: z.string(),
      id: z.string(),
      userId: z.string(),
      status: z.enum(schema.userActionStatus.enumValues),
      lastStatus: z.enum(schema.userActionStatus.enumValues).nullable(),
    }),
  },
  "appeal-action/status-changed": {
    data: z.object({
      clerkOrganizationId: z.string(),
      id: z.string(),
      appealId: z.string(),
      status: z.enum(schema.appealActionStatus.enumValues),
      lastStatus: z.enum(schema.appealActionStatus.enumValues).nullable(),
    }),
  },
};

export const inngest = new Inngest({
  id: env.INNGEST_APP_NAME,
  schemas: new EventSchemas().fromZod(eventsMap),
});

export type Events = GetEvents<typeof inngest>;
