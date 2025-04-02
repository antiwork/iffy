import { openai } from "@ai-sdk/openai";
import { createProviderRegistry, LanguageModel } from "ai";
import { merge } from "ts-deepmerge";

type ProviderRegistryConfig = Parameters<typeof createProviderRegistry>[0];
type ProviderRegistry = ReturnType<typeof createProviderRegistry>;

type PromptStrategyConfig = {
  promptModel?: LanguageModel | ((registry: ProviderRegistry) => LanguageModel) | string;
  judgeModel?: LanguageModel | ((registry: ProviderRegistry) => LanguageModel) | string;
};

type BlocklistStrategyConfig = {};

type OpenAIStrategyConfig = {};

type Config = {
  registry?: ProviderRegistryConfig;
  strategies?: {
    prompt?: PromptStrategyConfig;
    blocklist?: BlocklistStrategyConfig;
    openai?: OpenAIStrategyConfig;
  };
};

const defaultConfig: Config = {
  registry: {
    openai,
  },
  strategies: {
    prompt: {
      promptModel: "openai:gpt-4o-mini",
      judgeModel: "openai:gpt-4o-mini",
    },
  },
};

export function defineConfig(config: Config) {
  return merge(defaultConfig, config);
}
