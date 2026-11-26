"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BooksTea } from "@/components/illustrations/BooksTea";
import { LavenderSprig } from "@/components/illustrations/Lavender";
import { NAV_ITEMS } from "./nav";
import { NavIconSvg } from "./NavIcons";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="relative hidden w-[17rem] shrink-0 flex-col border-r border-lavender-soft/70 bg-sidebar/95 px-4 py-7 backdrop-blur-sm lg:flex">
      <div className="mb-10 flex items-start gap-2.5 px-2">
        <LavenderSprig className="mt-0.5 h-12 w-7 shrink-0" />
        <div>
          <p className="font-display text-[1.35rem] leading-tight text-lavender-deep">
            Study Diary
          </p>
          <p className="mt-1 text-xs text-ink-muted">
            Arin &amp; Emon · private
          </p>
        </div>
      </div>

      <nav aria-label="Main" className="flex flex-1 flex-col gap-1.5">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-3 rounded-full px-4 py-3 text-sm font-semibold transition-all duration-200 active:scale-[0.98]",
                active
                  ? "bg-lavender text-white shadow-soft"
                  : "text-ink-muted hover:bg-white/70 hover:text-ink",
              ].join(" ")}
              aria-current={active ? "page" : undefined}
            >
              <NavIconSvg name={item.icon} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-1 pt-8 opacity-95">
        <BooksTea className="h-28 w-full" />
      </div>
    </aside>
  );
}
