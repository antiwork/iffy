"use client";

import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";

export default function Page() {
  const { signOut } = useClerk();
  const router = useRouter();

  useLayoutEffect(() => {
    signOut();
    router.push("/");
  }, [signOut, router]);

  return <div className="flex h-screen w-screen items-center justify-center"></div>;
}
