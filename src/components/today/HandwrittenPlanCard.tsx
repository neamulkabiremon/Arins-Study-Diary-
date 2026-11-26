"use client";

import { Button } from "@/components/ui/Button";

export function HandwrittenPlanCard({
  photoUrl,
  demo,
}: {
  photoUrl?: string | null;
  demo?: boolean;
}) {
  if (!photoUrl) {
    return (
      <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card">
        <h2 className="font-display text-lg text-ink">Handwritten plan</h2>
        <p className="mt-2 text-sm text-ink-muted">
          No notebook photo linked for today.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-[1.35rem] border border-lavender-soft bg-card p-4 shadow-card sm:p-5">
      <h2 className="mb-3 font-display text-lg text-ink">Handwritten plan</h2>
      {demo ? (
        <p className="mb-2 text-xs font-medium text-lavender">
          Labeled demo artwork — not a real photo
        </p>
      ) : null}
      <div className="overflow-hidden rounded-2xl border-[5px] border-white bg-ivory-deep shadow-soft rotate-[-1.2deg]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt="Handwritten plan"
          className="w-full object-contain bg-ivory"
        />
      </div>
      <Button
        variant="secondary"
        fullWidth
        className="mt-4"
        onClick={() => window.open(photoUrl, "_blank", "noopener,noreferrer")}
      >
        View plan
      </Button>
    </section>
  );
}
