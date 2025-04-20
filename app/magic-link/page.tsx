"use client";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export default function MagicLinkPage() {
  return (
    <div className="min-h-screen space-y-12 overflow-x-hidden bg-white pt-6 font-sans text-black sm:space-y-24">
      <div className="container mx-auto space-y-12 px-8">
        <div className="flex min-h-[calc(100vh-12rem)] flex-col items-center justify-center">
          <div className="flex w-full max-w-md flex-col items-center gap-8 text-center">
            <Mail className="h-16 w-16 text-green-600" />
            <div className="space-y-4">
              <h1 className="text-3xl font-medium tracking-[-0.02em] sm:text-4xl">Check your email</h1>
              <p className="text-lg text-gray-500">
                We&apos;ve sent you a magic link to sign in. Click the link in your email to continue.
              </p>
            </div>
            <Button
              className="w-full cursor-pointer bg-green-600 hover:bg-green-700"
              onClick={() => window.open("https://mail.google.com", "_blank")}
            >
              Open Gmail
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
