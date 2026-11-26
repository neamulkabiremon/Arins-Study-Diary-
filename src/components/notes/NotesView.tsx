"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiCreateNote, apiFulfillReward, hasApiBaseUrl } from "@/lib/api";
import { useDiary } from "@/lib/diary-store";
import { REWARD_LABELS } from "@/lib/reward-rules";
import { getSessionUser } from "@/lib/session";
import type { EncouragementNote, UserRole } from "@/lib/types";

const PROMPTS: Record<UserRole, string[]> = {
  emon: [
    "Proud of you for showing up today",
    "One Frog at a time — I've got you.",
    "Tea is ready when you finish.",
  ],
  arin: [
    "Studying hard · missing you a little",
    "Finished my Frog — your turn!",
    "Let's both hit the date goal this month.",
  ],
};

function formatWhen(iso: string) {
  try {
    return new Date(iso).toLocaleString("en-GB", {
      timeZone: "Asia/Dhaka",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function NoteBubble({
  note,
  mine,
}: {
  note: EncouragementNote;
  mine: boolean;
}) {
  const name =
    note.authorName || (note.authorRole === "arin" ? "Arin" : "Emon");
  return (
    <li className={["flex w-full", mine ? "justify-end" : "justify-start"].join(" ")}>
      <div
        className={[
          "max-w-[min(100%,22rem)] rounded-2xl px-4 py-3",
          mine
            ? "rounded-br-md bg-lavender text-white"
            : "rounded-bl-md bg-white text-ink ring-1 ring-lavender-soft",
        ].join(" ")}
      >
        <p
          className={[
            "text-[10px] font-semibold uppercase tracking-wide",
            mine ? "text-white/70" : "text-lavender-deep",
          ].join(" ")}
        >
          {mine ? "You" : name}
        </p>
        <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
          {note.body}
        </p>
        <p
          className={[
            "mt-2 text-[10px]",
            mine ? "text-white/50" : "text-ink-muted",
          ].join(" ")}
        >
          {formatWhen(note.createdAt)}
        </p>
      </div>
    </li>
  );
}

export function NotesView({ embedded = false }: { embedded?: boolean }) {
  const {
    notes,
    claims,
    addNote,
    fulfillClaim,
    weekly,
    demoMode,
    resetDemo,
    refreshLive,
  } = useDiary();
  const session = getSessionUser();
  const role: UserRole = session?.role ?? "arin";
  const myId = session?.id;
  const partnerName = role === "arin" ? "Emon" : "Arin";

  const [body, setBody] = useState("");
  const [showIdeas, setShowIdeas] = useState(false);
  const [showClaims, setShowClaims] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentFlash, setSentFlash] = useState(false);

  const prompts = PROMPTS[role];
  const thread = useMemo(
    () => [...notes].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [notes],
  );

  const openClaims = useMemo(() => {
    const list = weekly.recentClaims.length
      ? weekly.recentClaims.map((c) => ({
          id: c.id,
          choice: c.choice,
          fulfilled: c.fulfilled,
          pointsSpent: c.pointsSpent,
          tkAmount: c.tkAmount,
        }))
      : claims.map((c) => ({
          id: c.id,
          choice: c.choice,
          fulfilled: c.fulfilled,
          pointsSpent: undefined as number | undefined,
          tkAmount: undefined as number | null | undefined,
        }));
    return list.filter((c) => !c.fulfilled);
  }, [claims, weekly.recentClaims]);

  async function saveNote() {
    const text = body.trim();
    if (!text || sending) return;
    setError(null);
    setSending(true);
    try {
      if (!demoMode && hasApiBaseUrl()) {
        const res = await apiCreateNote(text);
        addNote(text, {
          id: res.note?.id,
          authorRole: res.note?.authorRole ?? role,
          authorName: res.note?.authorName ?? session?.displayName,
          createdBy: res.note?.createdBy ?? myId,
        });
        void refreshLive();
      } else {
        addNote(text, {
          authorRole: role,
          authorName:
            session?.displayName ??
            (role === "arin" ? "Arin Mahi" : "Emon"),
          createdBy: myId ?? role,
        });
      }
      setBody("");
      setSentFlash(true);
      window.setTimeout(() => setSentFlash(false), 2200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send note");
    } finally {
      setSending(false);
    }
  }

  async function markFulfilled(id: string) {
    setError(null);
    try {
      if (!demoMode && hasApiBaseUrl()) await apiFulfillReward(id);
      fulfillClaim(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not fulfill");
    }
  }

  return (
    <div className={embedded ? "space-y-4" : "mx-auto max-w-2xl space-y-5"}>
      {!embedded ? (
        <header>
          <h1 className="font-display text-[1.85rem] text-ink sm:text-4xl">
            Notes
          </h1>
          <p className="mt-1.5 text-sm text-ink-muted">
            Encouragements with {partnerName} — both of you can write.
          </p>
        </header>
      ) : null}

      <ul className="flex min-h-[14rem] flex-col gap-3 rounded-2xl bg-lavender-soft/25 p-4">
        {thread.length === 0 ? (
          <li className="py-12 text-center text-sm text-ink-muted">
            No notes yet — send the first one.
          </li>
        ) : (
          thread.map((n) => {
            const mine =
              (myId && n.createdBy === myId) ||
              (n.authorRole != null && n.authorRole === role) ||
              (!n.authorRole && n.createdBy === role);
            return <NoteBubble key={n.id} note={n} mine={Boolean(mine)} />;
          })
        )}
      </ul>

      <div className="sticky bottom-24 z-20 space-y-2 rounded-2xl border border-lavender-soft bg-card/95 p-3 shadow-soft backdrop-blur-md lg:bottom-4">
        {showIdeas ? (
          <div className="flex flex-wrap gap-2 pb-1">
            {prompts.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => {
                  setBody(p);
                  setShowIdeas(false);
                }}
                className="rounded-full bg-lavender-soft/80 px-3 py-1.5 text-left text-xs font-medium text-lavender-deep"
              >
                {p}
              </button>
            ))}
          </div>
        ) : null}
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder={`Write to ${partnerName}…`}
          className="w-full resize-none rounded-xl border-0 bg-ivory px-3 py-2.5 text-sm outline-none ring-1 ring-lavender-mid/40 focus:ring-2 focus:ring-lavender"
        />
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setShowIdeas((v) => !v)}
            className="text-xs font-semibold text-lavender-deep"
          >
            {showIdeas ? "Hide ideas" : "Ideas"}
          </button>
          <Button
            disabled={!body.trim() || sending}
            onClick={() => void saveNote()}
            className="!py-2.5 !px-4"
          >
            {sending ? "…" : "Send"}
          </Button>
        </div>
        {sentFlash ? (
          <p className="text-xs font-medium text-leaf" role="status">
            Sent — {partnerName} gets a beautiful email too
          </p>
        ) : null}
        {error ? (
          <p className="text-xs text-red-700" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowClaims((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl px-1 py-2 text-left text-sm font-semibold text-ink"
        >
          <span>
            Open claims
            {openClaims.length ? (
              <span className="ml-2 rounded-full bg-gold-soft px-2 py-0.5 text-[10px] font-bold text-ink">
                {openClaims.length}
              </span>
            ) : null}
          </span>
          <span className="text-xs text-ink-muted">
            {showClaims ? "Hide" : "Show"}
          </span>
        </button>
        {showClaims ? (
          <ul className="mt-2 space-y-2">
            {openClaims.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-3 rounded-xl bg-lavender-soft/40 px-3 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {REWARD_LABELS[c.choice as keyof typeof REWARD_LABELS] ??
                      c.choice}
                    {c.tkAmount ? ` · ${c.tkAmount} Tk` : ""}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {c.pointsSpent != null ? `−${c.pointsSpent} pts` : "waiting"}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  className="!py-2 !px-3"
                  onClick={() => void markFulfilled(c.id)}
                >
                  Done
                </Button>
              </li>
            ))}
            {openClaims.length === 0 ? (
              <li className="text-sm text-ink-muted">Nothing waiting.</li>
            ) : null}
          </ul>
        ) : null}
      </div>

      {demoMode && !embedded ? (
        <Button variant="ghost" onClick={resetDemo}>
          Reset demo data
        </Button>
      ) : null}
    </div>
  );
}
