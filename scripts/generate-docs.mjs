import * as OpenAPI from "fumadocs-openapi";
import { rimrafSync } from "rimraf";

const out = "./content/docs/api-reference/(endpoints)";

// Clean generated files
rimrafSync(out, {
  filter(v) {
    return !v.endsWith("index.mdx") && !v.endsWith("meta.json");
  },
});

// Input files
void OpenAPI.generateFiles({
  input: ["./openapi.json"],
  output: out,
  groupBy: "tag",
});
