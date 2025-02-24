import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border border-stone-200 px-1.5 py-0.5 text-xs font-semibold transition-colors focus:outline-hidden focus:ring-2 focus:ring-stone-950 focus:ring-offset-2 dark:border-stone-800 dark:focus:ring-stone-300",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-green-900 text-green-50 dark:text-green-950 dark:border-transparent dark:bg-green-200/50",
        secondary:
          "border-transparent bg-green-950/5 text-stone-900 dark:border-transparent dark:bg-zinc-700 dark:text-zinc-50",
        outline: "text-stone-950 dark:text-stone-50",
        success: "border-transparent bg-green-600/20 text-green-900 dark:text-green-300 dark:border-transparent",
        failure: "border-transparent bg-rose-600/20 text-rose-900 dark:text-rose-300 dark:border-transparent",
        warning: "border-transparent bg-yellow-600/20 text-yellow-900 dark:text-yellow-300 dark:border-transparent",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
