import type { ReactNode } from "react";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { docsOptions } from "@/app/layout.config";
import { BASE_URL } from "@/lib/constants";
import { source } from "@/lib/source";

export default async function Layout({ children }: { children: ReactNode }) {
  const currentPath = (await headers()).get("x-current-path") ?? "unknown";
  const slug = currentPath.split("/").filter(Boolean);

  if (currentPath === "/") redirect(BASE_URL);
  const page = source.getPage(slug);
  if (!page) notFound();

  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
