"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export function DayCompleteModal({
  open,
  title,
  body,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-[#2a2435]/45 p-4 backdrop-blur-[2px] sm:items-center"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-complete-title"
        className="animate-menu-pop w-full max-w-md overflow-hidden rounded-[1.5rem] border border-lavender-soft bg-card shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-lavender via-[#f0b7d0] to-gold" />
        <div className="px-6 py-7 text-center sm:px-8">
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-lavender">
            Full plan complete
          </p>
          <h2
            id="day-complete-title"
            className="mt-3 font-display text-2xl leading-snug text-lavender-deep sm:text-3xl"
          >
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted sm:text-base">
            {body}
          </p>
          <Button className="mt-7 w-full sm:w-auto" onClick={onClose}>
            Thank you — continue
          </Button>
        </div>
      </div>
    </div>
  );
}
