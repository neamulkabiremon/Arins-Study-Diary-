"use client";

import { useState } from "react";
import { CoffeeDate } from "@/components/illustrations/CoffeeDate";
import { Button } from "@/components/ui/Button";
import {
  ARIN_TREAT_COST,
  CASH_MIN_WITHDRAW,
  EXTRA_DATE_COST,
  REWARD_LABELS,
  dateChoiceForRole,
} from "@/lib/reward-rules";
import type { RewardChoice, UserRole } from "@/lib/types";

const ARIN_TREATS: Array<
  Exclude<RewardChoice, "cash" | "date_with_emon" | "date_with_arin">
> = ["chocolate", "makeup", "outfit", "personal_gift"];

export type CashClaimExtras = {
  note?: string;
  paymentMethod?: "bkash" | "rocket" | "nagad" | "other";
  paymentNumber?: string;
};

function AltIcon({ id }: { id: RewardChoice }) {
  const common = "h-6 w-6 text-lavender";
  if (id === "chocolate") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M4 12h16M12 6v12" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (id === "outfit") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M9 4h6l2 4 3 2-2 2v8H6v-8L4 10l3-2 2-4z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (id === "makeup") {
    return (
      <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M8 3v8M16 3v8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        <rect x="6" y="11" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" />
        <rect x="14" y="11" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  return (
    <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4v3M7 7h10l1.5 3H5.5L7 7zM6 10v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RewardPicker({
  balance,
  dateClaimedThisMonth,
  role = "arin",
  onClaim,
}: {
  balance: number;
  dateClaimedThisMonth: boolean;
  role?: UserRole;
  onClaim: (
    choice: RewardChoice,
    amount?: number,
    extras?: CashClaimExtras,
  ) => void;
}) {
  const [cashOpen, setCashOpen] = useState(false);
  const [cashAmount, setCashAmount] = useState(500);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "bkash" | "rocket" | "nagad" | "other"
  >("bkash");
  const [paymentNumber, setPaymentNumber] = useState("");
  const dateChoice = dateChoiceForRole(role);
  const dateLabel = REWARD_LABELS[dateChoice];
  const dateOk = !dateClaimedThisMonth && balance >= EXTRA_DATE_COST;
  const cashOk =
    Number.isFinite(cashAmount) &&
    cashAmount >= CASH_MIN_WITHDRAW &&
    cashAmount <= balance &&
    paymentNumber.trim().length >= 10;

  return (
    <section className="space-y-4">
      <button
        type="button"
        disabled={!dateOk}
        onClick={() =>
          onClaim(role === "emon" ? "date_with_arin" : "date_with_emon")
        }
        className={[
          "w-full overflow-hidden rounded-[1.35rem] border border-lavender-soft bg-card text-left shadow-card transition",
          dateOk ? "hover:ring-2 hover:ring-lavender" : "cursor-not-allowed opacity-85",
        ].join(" ")}
      >
        <CoffeeDate className="h-40 w-full sm:h-44" />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender">
            Top reward · once a month
          </p>
          <h2 className="mt-1 font-display text-xl text-lavender-deep">
            {dateLabel}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Earned by studying — on top of normal dates. {EXTRA_DATE_COST} pts.
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-lavender">
            {dateClaimedThisMonth
              ? "Already claimed this month"
              : dateOk
                ? `Claim for ${EXTRA_DATE_COST} pts`
                : `Need ${EXTRA_DATE_COST} pts (have ${balance})`}
          </span>
        </div>
      </button>

      {role === "arin" ? (
        <>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              Treats
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {ARIN_TREATS.map((id) => {
                const cost = ARIN_TREAT_COST[id];
                const ok = balance >= cost;
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={!ok}
                    onClick={() => onClaim(id)}
                    className={[
                      "flex flex-col items-center gap-1 rounded-2xl px-2 py-3 text-center transition",
                      ok
                        ? "bg-white ring-1 ring-lavender-mid/40 hover:bg-lavender-soft/50"
                        : "cursor-not-allowed bg-ivory-deep/40 opacity-55",
                    ].join(" ")}
                  >
                    <AltIcon id={id} />
                    <span className="text-xs font-bold text-ink">
                      {REWARD_LABELS[id]}
                    </span>
                    <span className="text-[10px] font-medium text-ink-muted">
                      {cost}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCashOpen(true)}
            disabled={balance < CASH_MIN_WITHDRAW}
            className="flex w-full items-center justify-between rounded-2xl bg-lavender-soft/50 px-4 py-3.5 text-left transition hover:bg-lavender-soft disabled:opacity-50"
          >
            <div>
              <p className="text-sm font-bold text-lavender-deep">
                Withdraw cash
              </p>
              <p className="text-xs text-ink-muted">
                1 pt = 1 Tk · min {CASH_MIN_WITHDRAW}
              </p>
            </div>
            <span className="text-sm font-semibold text-lavender">Open</span>
          </button>
        </>
      ) : (
        <p className="rounded-2xl bg-lavender-soft/40 px-4 py-3 text-sm text-ink-muted">
          Finish your checklist to bank points toward a date with Arin.
        </p>
      )}

      {cashOpen ? (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 p-4 sm:items-center"
          role="dialog"
          aria-modal
          aria-label="Cash withdraw"
          onClick={() => setCashOpen(false)}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-card shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-lavender-soft px-5 py-4">
              <p className="font-display text-lg text-ink">Cash withdraw</p>
              <p className="text-xs text-ink-muted">
                Balance {balance} pts · Emon gets an email
              </p>
            </div>
            <div className="space-y-3 px-5 py-4">
              <label className="block text-sm font-semibold">
                Points / Tk
                <input
                  type="number"
                  min={CASH_MIN_WITHDRAW}
                  max={balance}
                  step={50}
                  value={cashAmount}
                  onChange={(e) => setCashAmount(Number(e.target.value))}
                  className="mt-1 block w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5 outline-none focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                {[100, 500, 1000, 3000].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className="rounded-full bg-lavender-soft/70 px-3 py-1 text-xs font-semibold text-lavender-deep"
                    onClick={() => setCashAmount(Math.min(n, balance || n))}
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-semibold">
                  Send via
                  <select
                    value={paymentMethod}
                    onChange={(e) =>
                      setPaymentMethod(
                        e.target.value as "bkash" | "rocket" | "nagad" | "other",
                      )
                    }
                    className="mt-1 block w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5"
                  >
                    <option value="bkash">bKash</option>
                    <option value="rocket">Rocket</option>
                    <option value="nagad">Nagad</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <label className="block text-sm font-semibold">
                  Number
                  <input
                    type="tel"
                    inputMode="numeric"
                    placeholder="01XXXXXXXXX"
                    value={paymentNumber}
                    onChange={(e) => setPaymentNumber(e.target.value)}
                    className="mt-1 block w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5"
                  />
                </label>
              </div>
              <label className="block text-sm font-semibold">
                Note
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 block w-full resize-none rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5"
                />
              </label>
            </div>
            <div className="flex gap-2 border-t border-lavender-soft px-5 py-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setCashOpen(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                disabled={!cashOk}
                onClick={() => {
                  onClaim("cash", cashAmount, {
                    note: note.trim() || undefined,
                    paymentMethod,
                    paymentNumber: paymentNumber.trim(),
                  });
                  setCashOpen(false);
                }}
              >
                Withdraw {cashAmount} Tk
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
