"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();

  useEffect(() => {
    signOut({
      fetchOptions: {
        onResponse: () => {
          router.push("/");
        },
        onError: () => {
          router.push("/");
        },
      },
    });
  }, [router]);

  return <div className="flex h-screen w-screen items-center justify-center"></div>;
}
