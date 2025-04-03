import { openai } from "@ai-sdk/openai";
import merge from "lodash/merge";
import { Model, ProviderRegistryConfig } from "./ai";

export type PromptStrategyConfig = {
  promptModel?: Model;
  judgeModel?: Model;
};

export type BlocklistStrategyConfig = {};

export type OpenAIStrategyConfig = {};

export type Config = {
  registry?: ProviderRegistryConfig;
  strategies?: {
    prompt?: PromptStrategyConfig;
    blocklist?: BlocklistStrategyConfig;
    openai?: OpenAIStrategyConfig;
  };
};

export type ResolvedConfig = {
  registry: ProviderRegistryConfig;
  strategies: {
    prompt: Required<PromptStrategyConfig>;
    blocklist: BlocklistStrategyConfig;
    openai: OpenAIStrategyConfig;
  };
};

const defaultConfig: ResolvedConfig = {
  registry: {
    openai,
  },
  strategies: {
    prompt: {
      promptModel: "openai:gpt-4o",
      judgeModel: "openai:gpt-4o-mini",
    },
    blocklist: {},
    openai: {},
  },
};

export function defineConfig(config: Config): ResolvedConfig {
  return merge(defaultConfig, config);
}
