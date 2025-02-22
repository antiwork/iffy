"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { ClerkLoaded, ClerkLoading, OrganizationSwitcher } from "@clerk/nextjs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { MessageSquareX, LucideIcon, Book, Inbox, Code, Users, Mail, Settings, ChartBar } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { useSelectedLayoutSegment } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/toaster";
import { Logo } from "@/components/logo";
import { Badge } from "@/components/ui/badge";
import * as schema from "@/db/schema";

type OrganizationSettings = typeof schema.organizationSettings.$inferSelect;

export default function DynamicLayout({
  children,
  organizationSettings,
  inboxCount,
}: Readonly<{
  children: React.ReactNode;
  organizationSettings: OrganizationSettings;
  inboxCount: number;
}>) {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const navLinks = [
    ...(organizationSettings.appealsEnabled
      ? [
          {
            title: "Inbox",
            icon: Inbox,
            slug: "inbox",
            badge: inboxCount > 0 ? inboxCount : undefined,
          },
        ]
      : []),
    {
      title: "Moderations",
      icon: MessageSquareX,
      slug: "moderations",
    },
    {
      title: "Users",
      icon: Users,
      slug: "users",
    },
  ];

  const secondaryNavLinks = [
    {
      title: "Rules",
      icon: Book,
      slug: "rules",
    },
    {
      title: "Analytics",
      icon: ChartBar,
      slug: "analytics",
    },
    ...(organizationSettings.emailsEnabled
      ? [
          {
            title: "Emails",
            icon: Mail,
            slug: "emails",
          },
        ]
      : []),
    {
      title: "Developer",
      icon: Code,
      slug: "developer",
    },
    {
      title: "Settings",
      icon: Settings,
      slug: "settings",
    },
  ];

  return (
    <main className="h-screen w-screen">
      <Toaster />
      <TooltipProvider delayDuration={0}>
        <ResizablePanelGroup
          direction="horizontal"
          onLayout={(sizes: number[]) => {
            document.cookie = `react-resizable-panels:layout=${JSON.stringify(sizes)}`;
          }}
          className="h-full items-stretch"
        >
          <ResizablePanel
            defaultSize={20}
            collapsedSize={4}
            collapsible={true}
            minSize={15}
            maxSize={20}
            onCollapse={() => {
              setIsCollapsed(true);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(true)}`;
            }}
            onResize={() => {
              setIsCollapsed(false);
              document.cookie = `react-resizable-panels:collapsed=${JSON.stringify(false)}`;
            }}
            className={cn(
              isCollapsed && "min-w-[50px] transition-all duration-300 ease-in-out",
              "bg-green-950/10 dark:bg-[#0D1C12]",
            )}
          >
            <div className={cn("flex h-[52px] items-center", isCollapsed ? "h-[52px] justify-center" : "px-4")}>
              <Logo variant={isCollapsed ? "icon" : "small"} />
            </div>
            <Separator className="dark:bg-green-900" />
            <Nav isCollapsed={isCollapsed} links={navLinks} />
            <Separator className="dark:bg-green-900" />
            <Nav isCollapsed={isCollapsed} links={secondaryNavLinks} />
          </ResizablePanel>
          <ResizableHandle withHandle className="dark:bg-green-900" />
          <ResizablePanel defaultSize={80}>
            <div className={cn("flex h-[52px] items-center justify-end px-4 dark:bg-zinc-900")}>
              <ClerkLoading>
                <Skeleton className="mr-2 h-[20px] w-[125px] rounded-sm" />
              </ClerkLoading>
              <ClerkLoaded>
                <OrganizationSwitcher appearance={{ elements: { organizationSwitcherTrigger: "dark:text-white" } }} />
              </ClerkLoaded>
            </div>
            <Separator />
            <div className="h-[calc(100%-52px-1px)] overflow-y-scroll dark:bg-zinc-900">{children}</div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </TooltipProvider>
    </main>
  );
}

const Nav = ({
  links,
  isCollapsed,
}: {
  isCollapsed: boolean;
  links: {
    title: string;
    label?: string;
    icon: LucideIcon;
    slug: string;
    badge?: number;
  }[];
}) => {
  const segment = useSelectedLayoutSegment();

  return (
    <div data-collapsed={isCollapsed} className="group flex flex-col gap-4 py-2 data-[collapsed=true]:py-2">
      <nav className="grid gap-1 px-2 group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2">
        {links.map((link, index) => {
          const href = `/dashboard/${link.slug}`;
          const isActive = segment === link.slug;
          const variant = isActive ? "default" : "ghost";

          return isCollapsed ? (
            <Tooltip key={index} delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  href={href}
                  className={cn(
                    buttonVariants({ variant, size: "icon" }),
                    "h-9 w-9",
                    isActive && "dark:bg-muted dark:hover:bg-muted dark:text-stone-500 dark:hover:text-white",
                    !isActive && "text-green-950/85 hover:bg-green-950/10 dark:text-green-300 dark:hover:bg-white/5",
                    "relative",
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="sr-only">{link.title}</span>
                  {link.badge ? (
                    <Badge
                      variant="default"
                      className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]"
                    >
                      {link.badge}
                    </Badge>
                  ) : null}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="flex items-center gap-4">
                {link.title}
                {link.label && <span className="ml-auto text-stone-500">{link.label}</span>}
              </TooltipContent>
            </Tooltip>
          ) : (
            <Link
              key={index}
              href={href}
              className={cn(
                buttonVariants({ variant, size: "sm" }),
                isActive && "dark:bg-muted dark:hover:bg-muted dark:text-white dark:hover:text-white",
                !isActive && "text-green-950/85 hover:bg-green-950/10 dark:text-green-300 dark:hover:bg-white/5",
                "justify-start",
                "relative",
              )}
            >
              <link.icon className="mr-2 h-4 w-4" />
              {link.title}
              {link.label && (
                <span className={cn("ml-auto", isActive && "text-background dark:text-white")}>{link.label}</span>
              )}
              {link.badge ? (
                <Badge variant="default" className="ml-auto">
                  {link.badge}
                </Badge>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
