"use client"

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useRouter } from 'next/navigation';
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { emailOtp } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "sonner";

export default function SignUp() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await emailOtp.sendVerificationOtp(
        {
          email: email,
          type: "sign-in",
        },
        {
          onResponse: (ctx) => {
            setLoading(false);
            console.log("OTP Sent successfully, navigating...");
            const encodedEmail = encodeURIComponent(email);
            router.push(`/sign-up/verify-email?email=${encodedEmail}`);
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
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">Sign In</CardTitle>
        <CardDescription className="text-xs md:text-sm">
          Enter your email below to login to your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="first-name">First name</Label>
              <Input
                id="first-name"
                placeholder="Max"
                required
                onChange={(e) => {
                  setFirstName(e.target.value);
                }}
                value={firstName}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last-name">Last name</Label>
              <Input
                id="last-name"
                placeholder="Robinson"
                required
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
                value={lastName}
              />
            </div>
          </div>
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
            />
            <Button
              disabled={loading}
              className="gap-2"
              onClick={handleSendOtp}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Sign - up"
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
