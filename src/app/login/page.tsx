"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LavenderSprig } from "@/components/illustrations/Lavender";
import { Button } from "@/components/ui/Button";
import { apiLogin, hasApiBaseUrl } from "@/lib/api";
import { isDemoMode } from "@/lib/mode";
import { setSession } from "@/lib/session";

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const demo = isDemoMode();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isDemoMode()) {
        setError("Demo mode is on — open /today without signing in.");
        return;
      }
      if (!hasApiBaseUrl()) {
        setError("Set NEXT_PUBLIC_API_BASE_URL to your Lambda API first.");
        return;
      }
      const { token, user } = await apiLogin(email, password);
      setSession(token, {
        id: user.id,
        role: user.role,
        email: user.email,
        displayName: user.displayName,
        avatarDataUrl: user.avatarDataUrl ?? null,
      });

      const next = search.get("next");
      const safeNext =
        next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      router.push(safeNext ?? "/today");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-md flex-col justify-center px-2">
      <div className="rounded-[1.5rem] border border-lavender-soft/80 bg-card/90 p-6 shadow-soft backdrop-blur-sm sm:p-8">
        <div className="flex items-center gap-2">
          <LavenderSprig className="h-12 w-7" />
          <h1 className="font-display text-3xl text-lavender-deep">
            Study Diary
          </h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-ink-muted">
          Private for Arin &amp; Emon — invite-only sign-in.
        </p>

        {demo ? (
          <p className="mt-4 rounded-xl bg-gold-soft/70 px-4 py-3 text-sm">
            Demo mode is active.{" "}
            <a href="/today" className="font-semibold text-lavender underline">
              Continue to Today
            </a>
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lavender-mid/50 bg-white px-4 py-3 outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-xl border border-lavender-mid/50 bg-white px-4 py-3 outline-none transition focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
              autoComplete="current-password"
            />
          </div>
          <Button type="submit" fullWidth disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        {error ? (
          <p className="mt-3 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[70dvh] items-center justify-center text-sm text-ink-muted">
          Loading…
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
