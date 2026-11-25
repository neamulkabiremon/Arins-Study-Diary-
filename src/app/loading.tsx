export default function Loading() {
  return (
    <div className="mx-auto max-w-2xl space-y-5 py-2" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-48 animate-pulse rounded-xl bg-lavender-soft/70" />
      <div className="h-4 w-64 animate-pulse rounded-lg bg-lavender-soft/50" />
      <div className="h-36 animate-pulse rounded-[1.35rem] bg-gradient-to-r from-lavender-soft/80 via-[#fff8f2] to-gold-soft/60" />
      <div className="h-28 animate-pulse rounded-[1.35rem] bg-white/70 shadow-card" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 animate-pulse rounded-2xl bg-lavender-soft/40" />
        <div className="h-24 animate-pulse rounded-2xl bg-lavender-soft/40" />
      </div>
    </div>
  );
}
