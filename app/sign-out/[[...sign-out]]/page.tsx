"use client";

import { useRouter } from "next/navigation";
import { useLayoutEffect } from "react";
import { signOut } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();

  useLayoutEffect(() => {
    signOut().then(() => {
      router.push("/");
    });
  }, [router]);

  return <div className="flex h-screen w-screen items-center justify-center"></div>;
}
