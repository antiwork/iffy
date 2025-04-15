import { redirect } from "next/navigation";
import { SignIn } from "@/components/sign-in";
import { auth } from "@/services/auth";

export default async function Page() {
  const { userId } = await auth();

  if (userId) return redirect("/dashboard");

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <SignIn />
    </div>
  );
}
