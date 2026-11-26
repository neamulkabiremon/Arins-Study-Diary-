"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LavenderSprig } from "@/components/illustrations/Lavender";
import { NotesView } from "@/components/notes/NotesView";
import { Tag } from "@/components/ui/Tag";
import { apiGetPartnerToday, hasApiBaseUrl } from "@/lib/api";
import { useDiary } from "@/lib/diary-store";
import { isDemoMode } from "@/lib/mode";
import { getSessionUser } from "@/lib/session";
import type { DailyPlan, PointsWallet, UserRole } from "@/lib/types";

type Tab = "tasks" | "notes";

type PartnerPayload = {
  planDate: string;
  partner: {
    id: string;
    role: UserRole;
    displayName: string;
    email: string;
    avatarDataUrl?: string | null;
  };
  plan: DailyPlan | null;
  wallet: PointsWallet;
  dateClaimedThisMonth: boolean;
  extraDateCost: number;
};

function Avatar({
  src,
  name,
  size = "md",
  ring,
}: {
  src?: string | null;
  name: string;
  size?: "md" | "lg";
  ring?: string;
}) {
  const dim = size === "lg" ? "h-16 w-16 sm:h-[4.5rem] sm:w-[4.5rem]" : "h-12 w-12";
  return (
    <span
      className={[
        "relative shrink-0 overflow-hidden rounded-full bg-lavender text-sm font-bold text-white",
        dim,
        ring ?? "ring-2 ring-white",
      ].join(" ")}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center">
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </span>
  );
}

function TogetherInner() {
  const router = useRouter();
  const search = useSearchParams();
  const tab: Tab = search.get("tab") === "notes" ? "notes" : "tasks";
  const me = getSessionUser();
  const { weekly, notes } = useDiary();
  const [data, setData] = useState<PartnerPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const setTab = (next: Tab) => {
    router.replace(next === "notes" ? "/together?tab=notes" : "/together", {
      scroll: false,
    });
  };

  const load = useCallback(async () => {
    setError(null);
    if (isDemoMode() || !hasApiBaseUrl()) {
      setData(null);
      setLoading(false);
      setError("Sign in (live mode) to see each other’s Today.");
      return;
    }
    try {
      setData(await apiGetPartnerToday());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load partner");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const onVis = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onVis);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onVis);
    };
  }, [load]);

  const myName =
    me?.displayName?.split(/\s+/)[0] ||
    (me?.role === "emon" ? "Emon" : "Arin");
  const partnerName =
    data?.partner.displayName.split(/\s+/)[0] ??
    (me?.role === "arin" ? "Emon" : "Arin");
  const partnerFull = data?.partner.displayName ?? partnerName;

  const done = data?.plan
    ? data.plan.tasks.filter((t) => t.completed).length
    : 0;
  const total = data?.plan?.tasks.length ?? 0;
  const pct = total ? Math.round((done / total) * 100) : 0;

  const latestFromPartner = useMemo(() => {
    const role = me?.role ?? "arin";
    return notes.find((n) =>
      n.authorRole
        ? n.authorRole !== role
        : n.createdBy !== (me?.id ?? role),
    );
  }, [me?.id, me?.role, notes]);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      {/* Duo hero */}
      <section className="relative overflow-hidden rounded-[1.5rem] bg-gradient-to-br from-lavender-soft via-[#f7f0fb] to-gold-soft/50 px-5 py-6 sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-3 top-2 opacity-70">
          <LavenderSprig className="h-16 w-9" />
        </div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-lavender-deep">
          Your shared diary
        </p>
        <h1 className="mt-1 font-display text-[1.85rem] leading-tight text-ink sm:text-4xl">
          {myName} &amp; {partnerName}
        </h1>
        <p className="mt-2 max-w-md text-sm text-ink-muted">
          See how they&apos;re doing today. Leave a note — they get a beautiful
          email too.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Avatar
            src={me?.avatarDataUrl}
            name={myName}
            size="lg"
            ring="ring-2 ring-white shadow-card"
          />
          <span
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-lavender-deep shadow-card"
            aria-hidden
          >
            <HeartMini />
          </span>
          <Avatar
            src={data?.partner.avatarDataUrl}
            name={partnerFull}
            size="lg"
            ring="ring-2 ring-white shadow-card"
          />
          <div className="ml-1 min-w-0">
            <p className="text-xs font-semibold text-ink-muted">Your banks</p>
            <p className="truncate text-sm font-bold text-lavender-deep">
              You {weekly.wallet.balance} · {partnerName}{" "}
              {data?.wallet.balance ?? "—"}
            </p>
          </div>
        </div>
      </section>

      {latestFromPartner && tab === "tasks" ? (
        <blockquote className="rounded-2xl border-l-4 border-lavender bg-white/70 px-4 py-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-lavender-deep">
            Latest from {partnerName}
          </p>
          <p className="mt-1 font-display text-base italic text-ink line-clamp-2">
            &ldquo;{latestFromPartner.body}&rdquo;
          </p>
          <button
            type="button"
            onClick={() => setTab("notes")}
            className="mt-2 text-xs font-bold text-lavender-deep underline"
          >
            Open notes
          </button>
        </blockquote>
      ) : null}

      <div
        role="tablist"
        aria-label="Together sections"
        className="flex gap-1 rounded-full bg-lavender-soft/70 p-1"
      >
        {(
          [
            { id: "tasks" as const, label: `${partnerName}'s Today` },
            { id: "notes" as const, label: "Notes" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={[
              "flex-1 rounded-full px-4 py-2.5 text-sm font-bold transition",
              tab === t.id
                ? "bg-white text-lavender-deep shadow-card"
                : "text-ink-muted hover:text-ink",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "notes" ? (
        <NotesView embedded />
      ) : (
        <>
          {loading ? (
            <p className="text-sm text-ink-muted">Loading…</p>
          ) : null}
          {error ? (
            <p
              className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {data ? (
            <div className="space-y-5">
              <section className="rounded-2xl bg-card px-5 py-4 shadow-card ring-1 ring-lavender-soft/80">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg text-ink">
                      {partnerFull}
                    </p>
                    <p className="text-sm text-ink-muted">
                      <span className="font-semibold text-lavender-deep">
                        {data.wallet.balance} pts
                      </span>
                      {data.dateClaimedThisMonth
                        ? " · date claimed this month"
                        : ` · ${data.wallet.balance}/${data.extraDateCost} toward date`}
                    </p>
                  </div>
                  {total > 0 ? (
                    <div className="text-right">
                      <p className="font-display text-2xl text-lavender-deep">
                        {pct}%
                      </p>
                      <p className="text-[11px] font-semibold text-ink-muted">
                        {done}/{total} done
                      </p>
                    </div>
                  ) : null}
                </div>
                {total > 0 ? (
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-lavender-soft">
                    <div
                      className="h-full rounded-full bg-lavender transition-[width] duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                ) : null}
              </section>

              <section>
                <div className="mb-3 flex items-baseline justify-between gap-2">
                  <h2 className="font-display text-lg text-ink">
                    Today&apos;s list
                  </h2>
                  <p className="text-xs text-ink-muted">{data.planDate}</p>
                </div>

                {!data.plan ? (
                  <div className="rounded-2xl bg-lavender-soft/35 px-5 py-8 text-center">
                    <p className="font-display text-lg text-lavender-deep">
                      Quiet day so far
                    </p>
                    <p className="mt-2 text-sm text-ink-muted">
                      {partnerName} hasn&apos;t confirmed a plan yet. Send a note
                      to nudge them gently.
                    </p>
                    <button
                      type="button"
                      onClick={() => setTab("notes")}
                      className="mt-4 inline-flex rounded-full bg-lavender px-4 py-2 text-sm font-bold text-white"
                    >
                      Write a note
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-lavender-soft/80 overflow-hidden rounded-2xl bg-white ring-1 ring-lavender-soft/70">
                    {[...data.plan.tasks]
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .map((t) => (
                        <li
                          key={t.id}
                          className="flex items-start gap-3 px-4 py-3.5"
                        >
                          <span
                            className={[
                              "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                              t.completed
                                ? "bg-leaf text-white"
                                : t.isFrog
                                  ? "bg-lavender text-white"
                                  : "bg-lavender-soft text-lavender-deep",
                            ].join(" ")}
                            aria-hidden
                          >
                            {t.completed ? "✓" : t.isFrog ? "F" : ""}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={[
                                "text-sm font-semibold",
                                t.completed
                                  ? "text-ink-muted line-through"
                                  : "text-ink",
                              ].join(" ")}
                            >
                              {t.title}
                            </p>
                            {t.tags.length ? (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {t.tags.map((tag) => (
                                  <Tag key={tag} tag={tag} />
                                ))}
                              </div>
                            ) : null}
                          </div>
                        </li>
                      ))}
                  </ul>
                )}
              </section>

              <p className="text-center text-sm text-ink-muted">
                Cheer them on in{" "}
                <button
                  type="button"
                  onClick={() => setTab("notes")}
                  className="font-semibold text-lavender-deep underline"
                >
                  Notes
                </button>
                — they&apos;ll get an email.
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function HeartMini() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M12 20s-7-4.35-7-9a3.7 3.7 0 0 1 7-1.7A3.7 3.7 0 0 1 19 11c0 4.65-7 9-7 9z" />
    </svg>
  );
}

export function TogetherView() {
  return (
    <Suspense fallback={<p className="text-sm text-ink-muted">Opening Together…</p>}>
      <TogetherInner />
    </Suspense>
  );
}
