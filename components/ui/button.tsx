import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-green-950/80 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-green-950/20 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 dark:ring-offset-stone-950 dark:focus-visible:ring-stone-300 gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-green-600 text-green-100 hover:bg-green-700",
        destructive:
          "bg-red-600/90 text-stone-50 hover:bg-red-600 dark:bg-red-900 dark:text-stone-50 dark:hover:bg-red-900/90",
        outline:
          "border border-stone-200 bg-white hover:bg-stone-100 hover:text-stone-900 dark:text-stone-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-stone-50",
        secondary:
          "text-stone-900 bg-green-950/10 hover:bg-green-950/15 dark:bg-zinc-100 dark:text-stone-900 dark:hover:bg-zinc-200",
        ghost:
          "text-stone-950/85 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-white/5 dark:data-[state=open]:bg-white/15",
        link: "text-stone-900 underline-offset-4 hover:underline dark:text-stone-50",
      },
      size: {
        default: "h-10 px-4 py-2",
        xs: "h-7 px-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
