import * as OpenAPI from "fumadocs-openapi";
import { rimrafSync } from "rimraf";

const output = "./content/docs/api-reference/(endpoints)";

// Clean generated files
rimrafSync(output, {
  filter(v) {
    return !v.endsWith("index.mdx") && !v.endsWith("meta.json");
  },
});

// Input files
void OpenAPI.generateFiles({
  input: ["./public/openapi.json"],
  output,
  groupBy: "tag",
});
