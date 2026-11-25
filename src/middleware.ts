import { NextResponse, type NextRequest } from "next/server";

/** Node runtime — required for Vercel deploys (Edge deprecated for anon / preferred). */
export const runtime = "nodejs";

const PUBLIC = new Set(["/login"]);

/**
 * Invite-only gate. Cookie is set on login (see session.ts).
 * Demo mode skips the gate so mock review still works without accounts.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const demo =
    process.env.NEXT_PUBLIC_DEMO_MODE === "true" ||
    (!process.env.NEXT_PUBLIC_DEMO_MODE &&
      !process.env.NEXT_PUBLIC_API_BASE_URL);

  if (demo) return NextResponse.next();

  const authed = request.cookies.get("arin_diary_auth")?.value === "1";

  if (PUBLIC.has(pathname)) {
    if (authed) {
      return NextResponse.redirect(new URL("/today", request.url));
    }
    return NextResponse.next();
  }

  if (!authed) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
