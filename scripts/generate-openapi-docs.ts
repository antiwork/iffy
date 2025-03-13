import { generateFiles } from "fumadocs-openapi";

const OUTPUT = "./content/docs/api-reference/(endpoints)";

void generateFiles({
  input: ["./openapi.json"],
  output: OUTPUT,
  groupBy: "tag",
});
