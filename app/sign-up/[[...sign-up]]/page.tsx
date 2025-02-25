import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { FEATURE_SIGNUP } from "@/config/feature-flags";

export default async function Page() {
  const { userId } = await auth();

  if (!FEATURE_SIGNUP) {
    return redirect("/sign-in");
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
