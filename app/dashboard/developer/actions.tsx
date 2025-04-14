"use server";

import { z } from "zod";
import { actionClient } from "@/lib/action-client";
import { revalidatePath } from "next/cache";
import * as apiKeysService from "@/services/api-keys";
import * as webhookService from "@/services/webhook";
import * as organizationService from "@/services/organizations";

const createWebhookSchema = z.object({
  url: z.string(),
});

const updateWebhookUrlSchema = z.object({
  url: z.string(),
});

const createApiKeySchema = z.object({
  name: z.string(),
});

const updateOrganizationSchema = z.object({
  emailsEnabled: z.boolean().optional(),
  testModeEnabled: z.boolean().optional(),
  appealsEnabled: z.boolean().optional(),
  stripeApiKey: z.string().optional(),
  moderationPercentage: z.number().optional(),
  suspensionThreshold: z.number().optional(),
});

export const createWebhook = actionClient
  .schema(createWebhookSchema)
  .action(async ({ parsedInput: { url }, ctx: { organizationId } }) => {
    const webhook = await webhookService.createWebhook({ organizationId, url });
    revalidatePath("/dashboard/developer");
    return webhook;
  });

export const updateWebhookUrl = actionClient
  .schema(updateWebhookUrlSchema)
  .bindArgsSchemas<[id: z.ZodString]>([z.string()])
  .action(async ({ parsedInput: { url }, bindArgsParsedInputs: [id], ctx: { organizationId } }) => {
    const webhook = await webhookService.updateWebhookUrl({ organizationId, id, url });
    revalidatePath("/dashboard/developer");
    return webhook;
  });

export const createApiKey = actionClient
  .schema(createApiKeySchema)
  .action(async ({ parsedInput: { name }, ctx: { organizationId, clerkUserId } }) => {
    const apiKey = await apiKeysService.createApiKey({ organizationId, clerkUserId, name });
    revalidatePath("/dashboard/developer");
    return apiKey;
  });

export const deleteApiKey = actionClient
  .bindArgsSchemas<[id: z.ZodString]>([z.string()])
  .action(async ({ bindArgsParsedInputs: [id], ctx: { organizationId } }) => {
    await apiKeysService.deleteApiKey({ organizationId, id });
    revalidatePath("/dashboard/developer");
  });

export const updateOrganization = actionClient
  .schema(updateOrganizationSchema)
  .action(async ({ parsedInput, ctx: { organizationId } }) => {
    const settings = await organizationService.updateOrganization(organizationId, parsedInput);
    revalidatePath("/dashboard/developer");
    revalidatePath("/dashboard/settings");
    return settings;
  });
