import { env } from "@/lib/env";
import { SignUp } from "@/components/sign-up";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/services/auth";

export default async function Page() {
  const { userId } = await auth();

  if (!env.ENABLE_PUBLIC_SIGNUP) {
    return notFound();
  }

  if (userId) return redirect("/dashboard");

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignUp />
    </div>
  );
}
