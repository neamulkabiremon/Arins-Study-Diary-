"use client";

import Link from "next/link";
import type { EncouragementNote, UserRole } from "@/lib/types";

/** Compact strip — not a competing hero card. */
export function PartnerNoteCard({
  note,
  myRole,
  compact = false,
}: {
  note: EncouragementNote | null | undefined;
  myRole: UserRole;
  compact?: boolean;
}) {
  if (!note) return null;
  const fromPartner =
    note.authorRole != null ? note.authorRole !== myRole : true;
  if (!fromPartner) return null;

  const who = note.authorName || (myRole === "arin" ? "Emon" : "Arin");

  if (compact) {
    return (
      <aside className="flex items-start gap-3 border-l-2 border-lavender px-3 py-1">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lavender-deep">
            From {who}
          </p>
          <p className="mt-0.5 truncate text-sm italic text-ink">
            &ldquo;{note.body}&rdquo;
          </p>
        </div>
        <Link
          href="/together?tab=notes"
          className="shrink-0 text-xs font-bold text-lavender-deep"
        >
          Reply
        </Link>
      </aside>
    );
  }

  return (
    <aside className="relative overflow-hidden rounded-2xl bg-lavender-soft/50 px-4 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-lavender-deep">
        Note from {who}
      </p>
      <p className="mt-1 font-display text-base italic leading-snug text-ink line-clamp-2">
        &ldquo;{note.body}&rdquo;
      </p>
      <Link
        href="/together?tab=notes"
        className="mt-2 inline-flex text-xs font-bold text-lavender-deep underline decoration-lavender-mid underline-offset-2"
      >
        Reply in Together
      </Link>
    </aside>
  );
}
