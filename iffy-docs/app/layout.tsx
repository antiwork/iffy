import "./global.css";
import { RootProvider } from "fumadocs-ui/provider";
import type { ReactNode } from "react";
import { IBM_Plex_Sans as FontSans } from "next/font/google";
import { IBM_Plex_Mono as FontMono } from "next/font/google";

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

export default async function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`flex min-h-screen flex-col font-sans antialiased ${fontSans.variable} ${fontMono.variable}`}>
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  );
}
