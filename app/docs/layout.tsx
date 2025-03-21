import { RootProvider } from "fumadocs-ui/provider";
import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/lib/docs/source";
import { Logo } from "@/components/logo";

const docsOptions: DocsLayoutProps = {
  nav: {
    title: <Logo />,
    url: "/docs",
  },
  tree: source.pageTree,
  githubUrl: "https://github.com/antiwork/iffy",
};

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <RootProvider
      theme={{
        enabled: false,
      }}
      search={{
        options: {
          api: "/api/docs/search",
        },
      }}
    >
      <DocsLayout {...docsOptions}>{children}</DocsLayout>
    </RootProvider>
  );
}
