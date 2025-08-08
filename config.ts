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
      defaultModel: "openai:gpt-5-mini",
      judgeModel: "openai:gpt-5-mini", // checks for ambiguity
    },
    // regex filtering
    blocklist: {},
  },
});
