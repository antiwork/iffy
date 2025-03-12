import "@/styles/globals.css";
import "@/lib/env";

import type { Metadata } from "next";
import { RootProvider as FumaDocsProvider } from "fumadocs-ui/provider";
import { IBM_Plex_Sans as FontSans } from "next/font/google";
import { IBM_Plex_Mono as FontMono } from "next/font/google";
import * as React from "react";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "next-themes";

import { cn } from "@/lib/utils";
import { ClerkProvider } from "@clerk/nextjs";
import TRPCProvider from "@/components/trpc";
import { ConfirmProvider } from "@/components/ui/confirm";

const fontSans = FontSans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
});

const fontMono = FontMono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Iffy",
  description: "Content moderation",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <TRPCProvider>
      <ClerkProvider>
        <ConfirmProvider>
          <html lang="en" suppressHydrationWarning>
            <body
              className={cn("bg-background min-h-screen font-sans antialiased", fontSans.variable, fontMono.variable)}
              suppressHydrationWarning
            >
              <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
                <FumaDocsProvider
                  theme={{
                    enabled: false,
                  }}
                  search={{
                    options: {
                      api: "/api/docs/search",
                    },
                  }}
                >
                  {children}
                </FumaDocsProvider>
                <Toaster />
              </ThemeProvider>
            </body>
          </html>
        </ConfirmProvider>
      </ClerkProvider>
    </TRPCProvider>
  );
}
