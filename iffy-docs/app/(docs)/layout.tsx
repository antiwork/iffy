import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { docsOptions } from "@/app/layout.config";
import { BASE_URL } from "@/lib/constants";

export default async function Layout({ children }: { children: ReactNode }) {
  const currentPath = (await headers()).get("x-current-path") ?? "unknown";

  if (currentPath === "/") redirect(BASE_URL);
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
