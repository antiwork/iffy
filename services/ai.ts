import { createProviderRegistry, LanguageModel } from "ai";
import config from "@/config";
import type { ResolvedConfig } from "./config";

export type ProviderRegistryConfig = Parameters<typeof createProviderRegistry>[0];
export type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

export type Model = LanguageModel | ((registry: ProviderRegistry) => LanguageModel) | `${string}:${string}`;

const registry = createProviderRegistry(config.registry);

export async function loadModel(m: Model): Promise<LanguageModel> {
  try {
    if (typeof m === "string") {
      return registry.languageModel(m);
    }
    if (typeof m === "function") {
      return m(registry);
    }
    return m;
  } catch (error) {
    throw new Error(typeof m === "string" ? `Model not found: ${m}` : "Invalid model");
  }
}

export async function loadModelFromConfig(selector: (config: ResolvedConfig) => Model): Promise<LanguageModel> {
  return await loadModel(selector(config));
}
