import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    return new NextResponse("ADMIN_PASSWORD not configured", { status: 500 });
  }

  const header = req.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const [, supplied] = decoded.split(":");
      if (supplied === password) return NextResponse.next();
    } catch {
      // fall through to challenge
    }
  }

  return new NextResponse("Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="sitegen admin"' },
  });
}

// Protect the admin UI and admin-only API routes.
// The Stripe webhook and public checkout endpoint stay public.
export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
