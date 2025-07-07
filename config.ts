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
      defaultModel: "openai:o4-mini",
      judgeModel: "openai:o4-mini", // checks for ambiguity
    },
    // regex filtering
    blocklist: {},
  },
});
