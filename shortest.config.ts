import type { ShortestConfig } from "@antiwork/shortest";

export default {
  headless: false,
  baseUrl: "http://localhost:3000",
  testPattern: "e2e/**/*.test.ts",
} satisfies ShortestConfig;
