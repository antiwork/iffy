import * as Blocklist from "./blocklist";
import * as Prompt from "./prompt";
import * as Classifier from "./classifier";
import { RawStrategy, Strategy } from "./types";

type StrategyDiscriminatedUnion = typeof Blocklist | typeof Prompt | typeof Classifier;

type StrategyIndex = {
  [T in StrategyDiscriminatedUnion["type"]]: Extract<StrategyDiscriminatedUnion, { type: T }>;
};

const strategies: StrategyIndex = {
  Blocklist,
  Prompt,
  Classifier,
};

export const makeStrategyInstance = async (s: RawStrategy) => {
  const strategy = transformStrategy(s);
  const { Strategy } = strategies[s.type];
  return new Strategy(strategy.options);
};

export const transformStrategy = <T extends keyof typeof strategies>(s: RawStrategy & { type: T }) => {
  const options = strategies[s.type].optionsSchema.parse(s.options);
  return {
    ...s,
    type: s.type,
    options,
  } as Extract<Strategy, { type: T }>;
};
