import { source } from "@/lib/docs/source";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(source);
