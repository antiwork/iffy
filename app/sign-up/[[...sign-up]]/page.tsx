import { enablePublicSignupFlag } from "@/flags";
import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { notFound, redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth();
  const enablePublicSignup = await enablePublicSignupFlag();

  if (!enablePublicSignup) {
    return notFound();
  }

  if (!userId) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <SignUp />
      </div>
    );
  }

  return redirect("/dashboard");
}
