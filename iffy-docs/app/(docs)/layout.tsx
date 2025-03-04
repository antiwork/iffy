import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { docsOptions } from "@/app/layout.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Layout({ children }: { children: ReactNode }) {
  const currentPath = (await headers()).get("x-current-path") ?? "unknown";

  if (currentPath === "/") redirect("/introduction");
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
