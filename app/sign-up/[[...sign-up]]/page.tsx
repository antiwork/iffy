import { env } from "@/lib/env";
import SignUp from "@/components/sign-up"
import { auth } from "@/lib/auth"
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!env.ENABLE_PUBLIC_SIGNUP) {
    return notFound();
  }

  if (!session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <SignUp />
      </div>
    );
  }

  return redirect("/dashboard");
}
