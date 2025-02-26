import { SignIn } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function Page() {
  const { userId } = await auth();

  if (userId) {
    return redirect("/dashboard");
  } else {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <SignIn />
      </div>
    );
  }
}
