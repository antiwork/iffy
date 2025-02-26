import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { signupEnabled } from "@/flags";

export default async function Page() {
  const { userId } = await auth();

  if (!(await signupEnabled())) {
    return redirect("/sign-in");
  }

  if(userId) {
    return redirect("/dashboard");
  } else {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <SignUp />
      </div>
    );
  }
}
