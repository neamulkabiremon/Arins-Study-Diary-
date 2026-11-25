"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ITEMS } from "./nav";
import { NavIconSvg } from "./NavIcons";

export function MobileNav() {
  const pathname = usePathname();
  // Soft press feedback via transition classes on links

  return (
    <nav
      aria-label="Mobile"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-lavender-soft/90 bg-ivory/95 shadow-[0_-8px_30px_rgba(92,61,130,0.06)] backdrop-blur-md lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={[
                  "flex flex-col items-center gap-1 px-2 py-3 text-[11px] font-semibold transition-all duration-200 active:scale-95",
                  active ? "text-lavender" : "text-ink-muted",
                ].join(" ")}
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={[
                    "flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200",
                    active ? "bg-lavender-soft text-lavender-deep scale-105" : "",
                  ].join(" ")}
                >
                  <NavIconSvg name={item.icon} className="h-5 w-5" />
                </span>
                {item.short}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
