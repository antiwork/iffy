"use client";

import { useRouter } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

export function RouterSheet({ children, title }: { children: React.ReactNode; title: string }) {
  const router = useRouter();

  return (
    <Sheet defaultOpen open>
      <SheetContent
        className="overflow-y-auto p-[unset] sm:min-w-[50%]"
        showClose={false}
        onPointerDownOutside={(e) => {
          e.preventDefault();
          router.back();
        }}
        disableAnimation={true}
      >
        <VisuallyHidden asChild>
          <SheetTitle>{title}</SheetTitle>
        </VisuallyHidden>
        {children}
      </SheetContent>
    </Sheet>
  );
}
