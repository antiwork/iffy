"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Section = React.forwardRef<HTMLDivElement, SectionProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4 px-6 py-4", className)} {...props}>
    {children}
  </div>
));
Section.displayName = "Section";

interface SectionTitleProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SectionTitle = React.forwardRef<HTMLDivElement, SectionTitleProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("leading-none font-semibold tracking-tight", className)} {...props}>
    {children}
  </div>
));
SectionTitle.displayName = "SectionTitle";

interface SectionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const SectionContent = React.forwardRef<HTMLDivElement, SectionContentProps>(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={cn(className)} {...props}>
      {children}
    </div>
  ),
);
SectionContent.displayName = "SectionContent";

export { Section, SectionTitle, SectionContent };
