import { NextRequest, NextResponse } from "next/server";
import { isProtectedRoute } from "./lib/protected-route";
import { Session } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const loginUrl = new URL("/sign-in", req.url);

  if (!isProtectedRoute(pathname)) return NextResponse.next();

  const response = await fetch(req.nextUrl.origin + "/api/auth/get-session", {
    headers: {
      cookie: req.headers.get("cookie") || "",
    },
  });

  const session = (await response.json()) as Session;

  if (!session) {
    return NextResponse.redirect(loginUrl);
  }

  const role = session.session.activeOrganizationRole;
  const isAdmin = role === "admin" || role === "owner";

  if (!isAdmin) {
    const loginUrl = new URL("/sign-in", req.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
