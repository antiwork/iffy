import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const response = NextResponse.next();
  response.headers.set("x-current-path", pathname);
  return response;
}

export const config = {
  matcher: "/:path*",
};
