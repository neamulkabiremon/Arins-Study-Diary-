"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { LeafCorner } from "@/components/illustrations/Lavender";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";
import { NavProgress } from "./NavProgress";
import { PageTransition } from "./PageTransition";
import { Sidebar } from "./Sidebar";

export function AppShell({
  children,
  demoBanner,
}: {
  children: ReactNode;
  demoBanner?: string | null;
}) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  if (isLogin) {
    return (
      <div className="relative min-h-dvh">
        <NavProgress />
        <div
          className="pointer-events-none absolute right-0 top-0 z-0 opacity-80"
          aria-hidden
        >
          <LeafCorner className="h-28 w-28 sm:h-36 sm:w-36" />
        </div>
        <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-7">
          <PageTransition>{children}</PageTransition>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh lg:flex">
      <NavProgress />
      <div
        className="pointer-events-none absolute right-0 top-0 z-0 opacity-80"
        aria-hidden
      >
        <LeafCorner className="h-28 w-28 sm:h-36 sm:w-36" />
      </div>
      <Sidebar />
      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        {demoBanner ? (
          <div
            role="status"
            className="border-b border-lavender-mid/30 bg-gold-soft/80 px-4 py-2 text-center text-xs font-medium text-ink"
          >
            {demoBanner}
          </div>
        ) : null}
        <header className="sticky top-0 z-40 border-b border-lavender-soft/40 bg-[#faf7f3]/85 px-4 py-2.5 backdrop-blur-md sm:px-7">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
            <p className="font-display text-base text-lavender-deep lg:invisible lg:text-lg">
              Study Diary
            </p>
            <AccountMenu />
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-5 sm:px-7 sm:pt-7 lg:pb-12">
          <PageTransition>{children}</PageTransition>
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
