"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface HeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Header = React.forwardRef<HTMLDivElement, HeaderProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-baseline justify-between space-x-4 px-6 py-4", className)} {...props}>
    {children}
  </div>
));
Header.displayName = "Header";

interface HeaderContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const HeaderContent = React.forwardRef<HTMLDivElement, HeaderContentProps>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("min-w-0 flex-1 space-y-2", className)} {...props}>
    {children}
  </div>
));
HeaderContent.displayName = "HeaderContent";

interface HeaderPrimaryProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const HeaderPrimary = React.forwardRef<HTMLDivElement, HeaderPrimaryProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("line-clamp-3 text-xl leading-none font-semibold tracking-tight dark:text-zinc-50", className)}
    {...props}
  >
    {children}
  </div>
));
HeaderPrimary.displayName = "HeaderPrimary";

interface HeaderSecondaryProps extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

const HeaderSecondary = React.forwardRef<HTMLHeadingElement, HeaderSecondaryProps>(
  ({ className, children, ...props }, ref) => (
    <h2 ref={ref} className={cn("text-stone-500 dark:text-zinc-500", className)} {...props}>
      {children}
    </h2>
  ),
);
HeaderSecondary.displayName = "HeaderSecondary";

interface HeaderActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const HeaderActions = React.forwardRef<HTMLDivElement, HeaderActionsProps>(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("", className)}
    {...props}
    onFocusCapture={(e) => {
      e.stopPropagation();
    }}
  >
    {children}
  </div>
));
HeaderActions.displayName = "HeaderActions";

export { Header, HeaderContent, HeaderPrimary, HeaderSecondary, HeaderActions };
