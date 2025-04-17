// src/components/SignIn.tsx
"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { client } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from 'next/navigation';
import { toast } from "sonner";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await client.emailOtp.sendVerificationOtp(
        {
          email: email,
          type: "sign-in",
        },
        {
          onResponse: (ctx) => {
            setLoading(false);
            console.log("OTP Sent successfully, navigating...");

            const encodedEmail = encodeURIComponent(email);
            router.push(`/sign-in/factor-one?email=${encodedEmail}`);
          },
          onError: (error) => {
            console.error("Error sending OTP (callback):", error);
            setLoading(false);
            toast.error(error.message || "Failed to send OTP. Please try again.");
          }
        }
      );

    } catch (error) {
      console.error("Error sending OTP (catch):", error);
      setLoading(false);
      toast.error(error instanceof Error ? error.message : "Failed to send OTP. Please try again.");
    }
  };


  return (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your email to receive a verification code
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              required
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              value={email}
              disabled={loading}
            />
            <Button
              disabled={loading || !email}
              className="gap-2 mt-2 w-full"
              onClick={handleSendOtp}
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Send Verification Code"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex justify-center w-full border-t py-4">
          <p className="text-center text-xs text-neutral-500">
            Powered by{" "}
            <Link
              href="https://better-auth.com"
              className="underline"
              target="_blank"
            >
              <span className="dark:text-orange-200/90">better-auth.</span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
