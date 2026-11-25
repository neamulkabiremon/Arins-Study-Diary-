export function WeeklyProgress({
  starCount,
  starDays,
  weekDays,
}: {
  starCount: number;
  starDays: string[];
  weekDays: string[];
}) {
  const tiles = weekDays.slice(0, 5);
  const earned = new Set(starDays);

  return (
    <section
      aria-labelledby="weekly-heading"
      className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card"
    >
      <h2 id="weekly-heading" className="font-display text-lg text-ink">
        This week&apos;s Study Stars
      </h2>
      <p className="mt-1 text-sm text-ink-muted">
        {Math.min(starCount, 5)} of 5 days with ≥50 points — keeps the habit
        visible while she banks points for rewards.
      </p>
      <ul className="mt-4 flex gap-2" aria-label="Study Star days">
        {tiles.map((day, i) => {
          const filled =
            earned.size > 0
              ? earned.has(day)
              : i < Math.min(starCount, 5);
          return (
            <li
              key={day}
              className={[
                "flex h-14 flex-1 items-center justify-center rounded-2xl border-2 transition-colors",
                filled
                  ? "border-lavender bg-lavender text-white shadow-soft"
                  : "border-lavender-mid/80 bg-white/50",
              ].join(" ")}
              aria-label={
                filled ? `Star day ${i + 1} earned` : `Star day ${i + 1} empty`
              }
            >
              {filled ? (
                <svg
                  viewBox="0 0 16 16"
                  className="h-5 w-5"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M3.5 8.5 6.5 11.5 12.5 4.5"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : (
                <span className="text-lavender-mid" aria-hidden>
                  ·
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
