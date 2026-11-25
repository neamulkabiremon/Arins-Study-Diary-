"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

/** Soft top progress bar on every route change. */
export function NavProgress() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    setVisible(true);
    setWide(false);
    const t1 = window.setTimeout(() => setWide(true), 40);
    const t2 = window.setTimeout(() => setVisible(false), 520);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-[3px] overflow-hidden"
      aria-hidden
    >
      <div
        className="h-full rounded-r-full bg-gradient-to-r from-lavender via-[#f0b7d0] to-gold transition-[width] duration-500 ease-out"
        style={{ width: wide ? "100%" : "18%" }}
      />
    </div>
  );
}
