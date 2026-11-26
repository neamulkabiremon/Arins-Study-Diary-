"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiCreateNote, apiFulfillReward, hasApiBaseUrl } from "@/lib/api";
import { useDiary } from "@/lib/diary-store";

const CHOICE_LABELS: Record<string, string> = {
  date_with_emon: "Extra date with Emon",
  date_with_arin: "Date with Arin",
  chocolate: "Chocolate",
  outfit: "Outfit",
  cash: "Cash",
  makeup: "Makeup",
  personal_gift: "Personal gift",
};

export function EmonView() {
  const { notes, claims, addNote, fulfillClaim, weekly, demoMode, resetDemo } =
    useDiary();
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function saveNote() {
    const text = body.trim();
    if (!text) return;
    setError(null);
    try {
      if (!demoMode && hasApiBaseUrl()) {
        await apiCreateNote(text);
      }
      addNote(text);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save note");
    }
  }

  async function markFulfilled(id: string) {
    setError(null);
    try {
      if (!demoMode && hasApiBaseUrl()) {
        await apiFulfillReward(id);
      }
      fulfillClaim(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fulfill");
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-3xl text-ink">Notes &amp; claims</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Leave encouragement and mark reward claims fulfilled. For live task
          lists and points, open{" "}
          <a href="/together" className="font-semibold text-lavender-deep underline">
            Together
          </a>
          .
        </p>
      </header>

      {demoMode ? (
        <p className="rounded-xl bg-gold-soft/70 px-4 py-3 text-xs font-medium">
          Demo view — sample notes and claims only. No access to real photos.
        </p>
      ) : null}

      <section className="rounded-2xl bg-card p-5 shadow-card">
        <h2 className="font-display text-lg text-ink">Encouragement note</h2>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={3}
          className="mt-3 w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2 text-sm"
          placeholder="A short note for Arin…"
        />
        <Button
          className="mt-3"
          disabled={!body.trim()}
          onClick={() => void saveNote()}
        >
          Save note
        </Button>
        {error ? (
          <p className="mt-2 text-sm text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-card">
        <h2 className="font-display text-lg text-ink">Recent notes</h2>
        <ul className="mt-3 space-y-3">
          {notes.map((n) => (
            <li key={n.id} className="rounded-xl bg-lavender-soft/40 px-3 py-2 text-sm">
              {n.body}
            </li>
          ))}
          {notes.length === 0 ? (
            <li className="text-sm text-ink-muted">No notes yet.</li>
          ) : null}
        </ul>
      </section>

      <section className="rounded-2xl bg-card p-5 shadow-card">
        <h2 className="font-display text-lg text-ink">Reward claims</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Arin&apos;s bank: {weekly.wallet.balance} pts · this week{" "}
          {weekly.starCount} Study Star
          {weekly.starCount === 1 ? "" : "s"}
        </p>
        <ul className="mt-4 space-y-3">
          {(weekly.recentClaims.length
            ? weekly.recentClaims.map((c) => ({
                id: c.id,
                weekStart: weekly.weekStart,
                choice: c.choice,
                claimedAt: c.claimedAt,
                fulfilled: c.fulfilled,
                pointsSpent: c.pointsSpent,
                tkAmount: c.tkAmount,
              }))
            : claims
          ).map((c) => (
            <li
              key={c.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-lavender-soft px-3 py-3"
            >
              <div>
                <p className="font-semibold text-ink">
                  {CHOICE_LABELS[c.choice] ?? c.choice}
                  {"tkAmount" in c && c.tkAmount
                    ? ` · ${c.tkAmount} Tk`
                    : ""}
                </p>
                <p className="text-xs text-ink-muted">
                  {"pointsSpent" in c && c.pointsSpent
                    ? `−${c.pointsSpent} pts · `
                    : ""}
                  {c.fulfilled ? "fulfilled" : "waiting"}
                </p>
              </div>
              {!c.fulfilled ? (
                <Button
                  variant="secondary"
                  onClick={() => void markFulfilled(c.id)}
                >
                  Mark fulfilled
                </Button>
              ) : (
                <span className="text-xs font-semibold text-leaf">Done</span>
              )}
            </li>
          ))}
          {weekly.recentClaims.length === 0 && claims.length === 0 ? (
            <li className="text-sm text-ink-muted">No claims yet.</li>
          ) : null}
        </ul>
      </section>

      {demoMode ? (
        <Button variant="ghost" onClick={resetDemo}>
          Reset demo data
        </Button>
      ) : null}
    </div>
  );
}
