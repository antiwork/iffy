import * as schema from "@/db/schema";
import { Context, StrategyResult } from "@/services/moderations";
import type * as Blocklist from "./blocklist";
import type * as Prompt from "./prompt";
import type * as Classifier from "./classifier";

export interface StrategyInstance {
  name: string;
  accepts: (context: Context) => Promise<boolean>;
  test: (context: Context) => Promise<StrategyResult>;
}

export type RawStrategy = typeof schema.ruleStrategies.$inferSelect | typeof schema.presetStrategies.$inferSelect;

export type Strategy =
  | (RawStrategy & {
      type: "Blocklist";
      options: Blocklist.Options;
    })
  | (RawStrategy & {
      type: "Prompt";
      options: Prompt.Options;
    })
  | (RawStrategy & {
      type: "Classifier";
      options: Classifier.Options;
    });
