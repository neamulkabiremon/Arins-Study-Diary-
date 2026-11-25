import { fromZonedTime } from "date-fns-tz";
import { DHAKA_TZ } from "../dates.js";

/**
 * Pull the first start time from titles like:
 * "Math 3:00 to 5:20", "Biology 9:30 AM", "9:00 A.M. → Wake up"
 */
export function parseTaskStartMinutes(title: string): number | null {
  const cleaned = title.replace(/\u2022/g, " ").trim();

  // Prefer "H:MM to/–/- ..." pattern (start of block)
  const range = cleaned.match(
    /(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)?\s*(?:to|–|-|→)/i,
  );
  if (range) {
    return toMinutes(Number(range[1]), Number(range[2]), range[3]);
  }

  const single = cleaned.match(/(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?)/i);
  if (single) {
    return toMinutes(Number(single[1]), Number(single[2]), single[3]);
  }

  // Bare time with no am/pm
  const bare = cleaned.match(/(?:^|\s)(\d{1,2}):(\d{2})(?:\s|$)/);
  if (bare) {
    return toMinutes(Number(bare[1]), Number(bare[2]));
  }

  return null;
}

function toMinutes(hour: number, minute: number, ampm?: string): number {
  let h = hour;
  const mer = (ampm || "").toLowerCase().replace(/\./g, "");
  if (mer.startsWith("p") && h < 12) h += 12;
  else if (mer.startsWith("a") && h === 12) h = 0;
  else if (!mer) {
    // Study diary times without am/pm default to PM
    // (Math 3:00, Physics 6:30, Chem 9:30 → evening stack).
    // Write "9:00 AM" explicitly for morning blocks.
    if (h >= 1 && h <= 11) h += 12;
  }
  if (h === 24) h = 0;
  return h * 60 + minute;
}

/** Dhaka wall-clock → Date for planDate + minutes-from-midnight */
export function dhakaDateTime(planDate: string, minutesFromMidnight: number): Date {
  const h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  return fromZonedTime(`${planDate}T${hh}:${mm}:00`, DHAKA_TZ);
}

export function formatClock(minutesFromMidnight: number): string {
  let h = Math.floor(minutesFromMidnight / 60);
  const m = minutesFromMidnight % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${String(m).padStart(2, "0")} ${ampm}`;
}
