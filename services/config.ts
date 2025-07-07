import { openai } from "@ai-sdk/openai";
import merge from "lodash/merge";
import { Model, ProviderRegistryConfig } from "./ai";

export type PromptStrategyConfig = {
  defaultModel?: Model;
  judgeModel?: Model;
};

export type BlocklistStrategyConfig = {};

export type ClassifierStrategyConfig = {};

export type Config = {
  registry?: ProviderRegistryConfig;
  strategies?: {
    prompt?: PromptStrategyConfig;
    blocklist?: BlocklistStrategyConfig;
    classifier?: ClassifierStrategyConfig;
  };
};

export type ResolvedConfig = {
  registry: ProviderRegistryConfig;
  strategies: {
    prompt: Required<PromptStrategyConfig>;
    blocklist: BlocklistStrategyConfig;
    classifier: ClassifierStrategyConfig;
  };
};

const defaultConfig: ResolvedConfig = {
  registry: {
    openai,
  },
  strategies: {
    prompt: {
      defaultModel: "openai:o4-mini",
      judgeModel: "openai:o4-mini",
    },
    blocklist: {},
    classifier: {},
  },
};

export function defineConfig(config: Config): ResolvedConfig {
  return merge(defaultConfig, config);
}
