import { DocsLayout, type DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { ReactNode } from "react";
import { source } from "@/lib/fumadocs/source";
import { Logo } from "@/components/logo";

const docsOptions: DocsLayoutProps = {
  nav: {
    title: <Logo />,
    url: "/docs",
  },
  tree: source.pageTree,
  sidebar: {
    tabs: {
      transform(option, node) {
        const meta = source.getNodeMeta(node);
        if (!meta) return option;

        // The "(guides)" folder represents a root-level route group
        // We remove the parentheses so that CSS variable can be set to customize it
        if (meta.file.dirname.includes("(guides)")) {
          meta.file.dirname = meta.file.dirname.replace(/\(guides\)/g, "guides");
        }

        const color = `var(--${meta.file.dirname}-color, var(--color-fd-foreground))`;

        return {
          ...option,
          icon: (
            <div
              className="rounded-md p-1 shadow-lg ring-2 [&_svg]:size-5"
              style={
                {
                  color,
                  border: `1px solid color-mix(in oklab, ${color} 50%, transparent)`,
                  "--tw-ring-color": `color-mix(in oklab, ${color} 20%, transparent)`,
                } as React.CSSProperties
              }
            >
              {node.icon}
            </div>
          ),
        };
      },
    },
  },
  githubUrl: "https://github.com/anti-work/iffy",
};

export default function Layout({ children }: { children: ReactNode }) {
  return <DocsLayout {...docsOptions}>{children}</DocsLayout>;
}
