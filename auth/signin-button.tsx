"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export const SignInButton = () => {
  return (
    <Button asChild variant="ghost" size="sm">
      <Link href="/sign-in">Sign in</Link>
    </Button>
  );
};

export const SignOutButton = () => {
  return (
    <Button asChild size="sm" variant={"ghost"}>
      <Link href="/sign-out">Sign out</Link>
    </Button>
  );
};

export const SignUpButton = () => {
  return (
    <Button asChild size="sm">
      <Link href="/sign-up">Sign up</Link>
    </Button>
  );
};
