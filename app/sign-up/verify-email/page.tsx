import VerifyOtp from "@/components/verify-otp";

export default async function verifyEmail({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;

  if (!email) {
    return <p>Email is required.</p>;
  }

  return (
    <div className="flex justify-center items-center min-h-screen" >
      <VerifyOtp email={email} type="sign-in" />
    </div>
  );
}
