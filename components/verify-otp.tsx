"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { client } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";

const RESEND_INTERVAL = 30;

interface VerifyOtpProps {
  email: string;
  type: "sign-in" | "email-verification" | string;
}

export default function VerifyOtp({ email, type }: VerifyOtpProps) {
  const [otp, setOtp] = useState("");
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [resendTimer, setResendTimer] = useState(RESEND_INTERVAL);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const router = useRouter();

  const startTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    setCanResend(false);
    setResendTimer(RESEND_INTERVAL);

    intervalRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  const handleVerify = async () => {
    if (otp.length !== 6 || loadingVerify || loadingResend) return;

    setLoadingVerify(true);
    setErrorMessage("");

    try {
      console.log(`Verifying OTP ${otp} for ${email}`);
      const result = await client.signIn.emailOtp({ email, otp });
      console.log("OTP Verification Successful:", result);

      if (intervalRef.current) clearInterval(intervalRef.current);
      router.push("/dashboard");
    } catch (error) {
      console.error("OTP Verification Failed:", error);
      const message = error instanceof Error ? error.message : "Invalid OTP.";
      setErrorMessage(message);
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || loadingResend || loadingVerify) return;

    setLoadingResend(true);
    setErrorMessage("");

    try {
      console.log(`Resending OTP for ${email}`);
      await client.emailOtp.sendVerificationOtp(
        { email, type: "sign-in" },
        {
          onResponse: () => {
            console.log("OTP has been resent successfully.");
            startTimer();
          },
        }
      );
    } catch (error) {
      console.error("Resend OTP Failed:", error);
      const message = error instanceof Error ? error.message : "Failed to resend OTP.";
      setErrorMessage(message);
      setCanResend(true); // allow manual retry
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <Card className="max-w-md w-full relative">
      <CardHeader>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          disabled={loadingVerify || loadingResend}
          className="absolute left-2 top-3 text-neutral-600 hover:text-neutral-900 h-8 w-8"
          aria-label="Go back"
        >
          &larr;
        </Button>

        <CardTitle className="text-lg md:text-xl text-center pt-8">
          Enter Verification Code
        </CardTitle>
        <CardDescription className="text-xs md:text-sm text-center">
          Enter the 6-digit code sent to {email}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="otp">Verification Code (OTP)</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="123456"
              required
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerify()}
              disabled={loadingVerify || loadingResend}
            />
            {errorMessage && (
              <p className="text-xs text-red-600 pt-1">{errorMessage}</p>
            )}
            <Button
              disabled={loadingVerify || loadingResend || otp.length !== 6}
              className="gap-2 mt-2 w-full"
              onClick={handleVerify}
            >
              {loadingVerify ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                "Verify Code"
              )}
            </Button>
          </div>

          <div className="text-center text-sm h-5">
            {canResend ? (
              <Button
                variant="link"
                className="p-0 h-auto font-normal text-blue-600 dark:text-blue-400"
                onClick={handleResend}
                disabled={loadingResend || loadingVerify}
              >
                {loadingResend ? (
                  <Loader2 size={14} className="animate-spin mr-1" />
                ) : null}
                Resend OTP
              </Button>
            ) : (
              <p className="text-neutral-500 text-xs">
                Resend OTP in {resendTimer}s
              </p>
            )}
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <div className="flex justify-center w-full border-t pt-4">
          <p className="text-center text-xs text-neutral-500">
            Powered by{" "}
            <Link href="https://better-auth.com" className="underline" target="_blank">
              <span className="dark:text-orange-200/90">better-auth</span>
            </Link>
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
