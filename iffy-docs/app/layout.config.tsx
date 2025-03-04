import { DocsLayoutProps } from "fumadocs-ui/layouts/docs";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/shared";
import { BASE_URL, IFFY_GITHUB_URL } from "@/lib/constants";
import { Logo } from "@/lib/logo-component";
import { sanitizeCSSVar } from "@/lib/sanitize-css-var";
import { source } from "@/lib/source";

export const baseOptions: BaseLayoutProps = {
  nav: {
    title: <Logo />,
    url: BASE_URL,
  },
};

export const docsOptions: DocsLayoutProps = {
  ...baseOptions,
  tree: source.pageTree,
  sidebar: {
    tabs: {
      transform(option, node) {
        const meta = source.getNodeMeta(node);
        if (!meta) return option;

        const color = `var(--${sanitizeCSSVar(meta.file.dirname)}-color, var(--color-fd-foreground))`;

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
  githubUrl: IFFY_GITHUB_URL,
};
