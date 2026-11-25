"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearSession, getToken, isLoggedIn } from "@/lib/session";
import { isDemoMode } from "@/lib/mode";

/**
 * Client-side invite gate (pairs with middleware cookie check).
 * Keeps JWT + cookie in sync; redirects strangers to /login.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isDemoMode()) {
      setReady(true);
      return;
    }

    const onLogin = pathname === "/login";
    const loggedIn = isLoggedIn();

    if (onLogin) {
      if (loggedIn) router.replace("/today");
      setReady(true);
      return;
    }

    if (!loggedIn) {
      // Stale cookie without JWT
      clearSession();
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      setReady(true);
      return;
    }

    // Ensure cookie exists for middleware when JWT is present
    if (getToken() && !document.cookie.includes("arin_diary_auth=1")) {
      document.cookie =
        "arin_diary_auth=1; Path=/; Max-Age=2592000; SameSite=Lax";
    }
    setReady(true);
  }, [pathname, router]);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-ink-muted">
        Opening diary…
      </div>
    );
  }

  return <>{children}</>;
}
