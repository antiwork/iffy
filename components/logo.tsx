import { cn } from "@/lib/utils";
import * as React from "react";

export const Logo = ({
  variant = "small",
  className,
}: {
  variant?: "icon" | "small" | "large";
  className?: string;
}) => {
  const sizeClass = variant === "small" || variant === "icon" ? "text-xl" : "text-3xl";

  return (
    <div
      className={cn(
        "decoration-skip-ink-none flex gap-2 text-left font-mono leading-[26px] font-medium underline-offset-[from-font] dark:text-green-600",
        sizeClass,
        className,
      )}
    >
      <span className="tracking-[-0.15em]">:/</span>
      {variant !== "icon" && <span>iffy</span>}
    </div>
  );
};
