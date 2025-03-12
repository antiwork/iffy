import { createElement } from "react";
import { docs } from "@/.source";
import { InferMetaType, InferPageType, loader } from "fumadocs-core/source";
import { icons } from "lucide-react";
import { attachFile, createOpenAPI } from "fumadocs-openapi/server";

export const source = loader({
  pageTree: {
    attachFile,
  },
  baseUrl: "/docs",
  source: docs.toFumadocsSource(),
  icon(icon) {
    if (!icon) return;

    if (icon in icons) return createElement(icons[icon as keyof typeof icons]);
  },
});

export const openapi = createOpenAPI();

export type Page = InferPageType<typeof source>;
export type Meta = InferMetaType<typeof source>;
