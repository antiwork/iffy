import * as React from "react";

import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-950 ring-offset-green-950/80 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 focus-visible:ring-2 focus-visible:ring-green-950/20 focus-visible:ring-offset-2 focus-visible:outline-hidden disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-stone-50 dark:ring-offset-stone-950 dark:placeholder:text-stone-400 dark:focus-visible:ring-stone-300 dark:focus-visible:ring-offset-stone-950",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

export { Input };
