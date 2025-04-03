import { createOpenAI } from "@ai-sdk/openai";
import { defineConfig } from "@/services/config";

export default defineConfig({
  registry: {
    openai: createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
  strategies: {
    prompt: {
      promptModel: "openai:gpt-4o",
      judgeModel: "openai:gpt-4o-mini",
    },
  },
});
