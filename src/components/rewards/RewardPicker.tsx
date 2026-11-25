"use client";

import { useState } from "react";
import { CoffeeDate } from "@/components/illustrations/CoffeeDate";
import { Button } from "@/components/ui/Button";
import {
  CASH_MIN_WITHDRAW,
  EXTRA_DATE_COST,
  REWARD_LABELS,
  TREAT_COST,
} from "@/lib/reward-rules";
import type { RewardChoice } from "@/lib/types";

const TREATS: Array<Exclude<RewardChoice, "cash" | "date_with_emon">> = [
  "chocolate",
  "makeup",
  "outfit",
  "personal_gift",
];

export type CashClaimExtras = {
  note?: string;
  paymentMethod?: "bkash" | "rocket" | "nagad" | "other";
  paymentNumber?: string;
};

function AltIcon({ id }: { id: RewardChoice }) {
  const common = "h-7 w-7 text-lavender";
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
  onClaim,
}: {
  balance: number;
  dateClaimedThisMonth: boolean;
  onClaim: (
    choice: RewardChoice,
    amount?: number,
    extras?: CashClaimExtras,
  ) => void;
}) {
  const [cashAmount, setCashAmount] = useState(500);
  const [note, setNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<
    "bkash" | "rocket" | "nagad" | "other"
  >("bkash");
  const [paymentNumber, setPaymentNumber] = useState("");
  const dateOk = !dateClaimedThisMonth && balance >= EXTRA_DATE_COST;
  const cashOk =
    Number.isFinite(cashAmount) &&
    cashAmount >= CASH_MIN_WITHDRAW &&
    cashAmount <= balance &&
    paymentNumber.trim().length >= 10;

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-lavender-soft bg-lavender-soft/40 px-4 py-3 text-sm text-ink">
        <p className="font-semibold text-lavender-deep">Spend your points</p>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-ink-muted">
          <li>
            <strong>Extra date with Emon</strong> — {EXTRA_DATE_COST} pts · once
            a month (regular girlfriend dates stay as usual)
          </li>
          <li>
            <strong>Chocolate</strong> {TREAT_COST.chocolate} · Makeup{" "}
            {TREAT_COST.makeup} · Outfit {TREAT_COST.outfit} · Gift{" "}
            {TREAT_COST.personal_gift}
          </li>
          <li>
            <strong>Cash</strong> — 1 point = 1 Tk (min {CASH_MIN_WITHDRAW})
          </li>
        </ul>
      </div>

      <button
        type="button"
        disabled={!dateOk}
        onClick={() => onClaim("date_with_emon")}
        className={[
          "w-full overflow-hidden rounded-[1.35rem] border border-lavender-soft bg-card text-left shadow-card transition",
          dateOk
            ? "hover:ring-2 hover:ring-lavender"
            : "cursor-not-allowed opacity-85",
        ].join(" ")}
      >
        <CoffeeDate className="h-44 w-full" />
        <div className="p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-lavender">
            Top study reward · 1× / month
          </p>
          <h2 className="mt-1 font-display text-xl text-lavender-deep">
            Extra date with Emon
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            On top of your normal dates — coffee, a walk, or a meal she earned by
            studying. Costs {EXTRA_DATE_COST} points (~a full strong month).
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

      <div>
        <p className="mb-2 text-sm font-semibold text-ink-muted">Treats</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TREATS.map((id) => {
            const cost = TREAT_COST[id];
            const ok = balance >= cost;
            return (
              <Button
                key={id}
                variant="secondary"
                className="h-auto flex-col gap-1 py-4"
                disabled={!ok}
                onClick={() => onClaim(id)}
              >
                <AltIcon id={id} />
                <span>{REWARD_LABELS[id]}</span>
                <span className="text-[10px] font-medium text-ink-muted">
                  {cost} pts
                </span>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="rounded-[1.35rem] border border-lavender-soft bg-card p-5 shadow-card">
        <h3 className="font-display text-lg text-ink">Withdraw as cash</h3>
        <p className="mt-1 text-sm text-ink-muted">
          1 study point = 1 Tk. Tell Emon where to send it (bKash / Rocket).
        </p>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="block text-sm font-semibold">
            Points / Tk
            <input
              type="number"
              min={CASH_MIN_WITHDRAW}
              max={balance}
              step={50}
              value={cashAmount}
              onChange={(e) => setCashAmount(Number(e.target.value))}
              className="mt-1 block w-36 rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5 outline-none focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {[100, 500, 1000, 3000].map((n) => (
            <button
              key={n}
              type="button"
              className="rounded-full bg-lavender-soft/70 px-3 py-1 text-xs font-semibold text-lavender-deep"
              onClick={() => setCashAmount(Math.min(n, balance || n))}
            >
              {n} Tk
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Send via
            <select
              value={paymentMethod}
              onChange={(e) =>
                setPaymentMethod(
                  e.target.value as "bkash" | "rocket" | "nagad" | "other",
                )
              }
              className="mt-1 block w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5 outline-none focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
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
              className="mt-1 block w-full rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5 outline-none focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
            />
          </label>
        </div>

        <label className="mt-3 block text-sm font-semibold">
          Note / preference
          <textarea
            rows={2}
            placeholder="e.g. Personal account · evening ok"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="mt-1 block w-full resize-none rounded-xl border border-lavender-mid/50 bg-white px-3 py-2.5 outline-none focus:border-lavender focus:ring-2 focus:ring-lavender-soft"
          />
        </label>

        <Button
          className="mt-4"
          disabled={!cashOk}
          onClick={() =>
            onClaim("cash", cashAmount, {
              note: note.trim() || undefined,
              paymentMethod,
              paymentNumber: paymentNumber.trim(),
            })
          }
        >
          Withdraw {cashAmount} Tk
        </Button>
      </div>
    </section>
  );
}
