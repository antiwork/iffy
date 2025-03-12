import { source } from "@/lib/fumadocs/source";
import { createFromSource } from "fumadocs-core/search/server";

export const { GET } = createFromSource(source);
