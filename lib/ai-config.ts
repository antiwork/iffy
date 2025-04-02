import { z } from "zod";
import { openai, createOpenAI } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";
import { anthropic, createAnthropic } from "@ai-sdk/anthropic";
import { groq, createGroq } from "@ai-sdk/groq";

export const modelProviderSchema = z.discriminatedUnion("provider", [
  z.object({
    provider: z.literal("openai"),
    model: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
  }),
  z.object({
    provider: z.literal("azure"),
    model: z.string(),
    baseUrl: z.string().url(),
    apiKey: z.string(),
    apiVersion: z.string().optional().default("2023-12-01-preview"),
    deploymentName: z.string().optional(),
  }),
  z.object({
    provider: z.literal("anthropic"),
    model: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
  }),
  z.object({
    provider: z.literal("groq"),
    model: z.string(),
    apiKey: z.string().optional(),
    baseUrl: z.string().url().optional(),
  }),
]);

export type ModelProviderConfig = z.infer<typeof modelProviderSchema>;

export const aiConfig = {
  moderationModel: {
    provider: "openai",
    model: "gpt-4o",
  } as ModelProviderConfig,

  judgeModel: {
    provider: "openai",
    model: "gpt-4o-mini",
  } as ModelProviderConfig,
};

export function getModelFromConfig(config: ModelProviderConfig): any {
  // Helper to create provider with custom config
  const createProvider = (provider: string, model: string, options: any) => {
    switch (provider) {
      case "openai":
        return createOpenAI(options)(model);
      case "anthropic":
        return createAnthropic(options)(model);
      case "groq":
        return createGroq(options)(model);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  };

  if (config.provider === "azure") {
    const azureProvider = createAzure({
      baseURL: config.baseUrl,
      apiKey: config.apiKey,
      apiVersion: config.apiVersion,
    });
    return azureProvider(config.deploymentName || config.model);
  }

  // For non-Azure providers
  if (config.apiKey) {
    const options: any = { apiKey: config.apiKey };
    if (config.baseUrl) options.baseURL = config.baseUrl;
    return createProvider(config.provider, config.model, options);
  }

  // Use default provider when no custom API key is provided
  switch (config.provider) {
    case "openai":
      return openai(config.model);
    case "anthropic":
      return anthropic(config.model);
    case "groq":
      return groq(config.model);
    default:
      throw new Error(`Unsupported provider: ${(config as ModelProviderConfig).provider}`);
  }
}
