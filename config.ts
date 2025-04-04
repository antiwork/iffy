import { createOpenAI } from "@ai-sdk/openai";
import { defineConfig } from "@/services/config";

export default defineConfig({
  registry: {
    openai: createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
  strategies: {
    // LLM-based moderation
    prompt: {
      defaultModel: "openai:gpt-4o",
      judgeModel: "openai:gpt-4o-mini", // checks for ambiguity
    },
    // regex filtering
    blocklist: {},
  },
});
