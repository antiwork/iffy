import SignIn from "@/components/sign-in";
import { auth } from "@/lib/auth"
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await auth.api.getSession({
    headers: await headers()
  });

  if (!session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <SignIn />
      </div>
    );
  }

  return redirect("/dashboard");
}
