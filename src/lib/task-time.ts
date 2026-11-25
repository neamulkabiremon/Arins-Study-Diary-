/**
 * Parse start minutes from titles like "Math 3:00 to 5:20".
 * Bare times without am/pm default to PM (study diary evening stack).
 */
export function parseTaskStartMinutes(title: string): number | null {
  const cleaned = title.replace(/\u2022/g, " ").trim();

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
    if (h >= 1 && h <= 11) h += 12;
  }
  if (h === 24) h = 0;
  return h * 60 + minute;
}

/** Sort tasks earliest → latest by parsed start time; untimed last. */
export function sortTasksByStartTime<T extends { title: string; sortOrder?: number }>(
  tasks: T[],
): T[] {
  return [...tasks].sort((a, b) => {
    const am = parseTaskStartMinutes(a.title);
    const bm = parseTaskStartMinutes(b.title);
    if (am == null && bm == null) {
      return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    }
    if (am == null) return 1;
    if (bm == null) return -1;
    if (am !== bm) return am - bm;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}
