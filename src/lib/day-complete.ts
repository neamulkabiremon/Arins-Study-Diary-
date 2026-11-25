import { messageDayIndex } from "./dates";

export const DAY_COMPLETE_MESSAGES = [
  {
    title: "You did it, Arin",
    body: "Every box checked. Tomorrow-you is already smiling.",
  },
  {
    title: "Full plan. Full heart.",
    body: "That wasn’t luck — that was you showing up, block after block.",
  },
  {
    title: "Study star energy",
    body: "HSC, medical, engineering — you held the whole day with grace.",
  },
  {
    title: "Quiet excellence",
    body: "No drama. Just a completed checklist and a proud mind.",
  },
  {
    title: "Frog eaten. Day won.",
    body: "Hard things first, soft landing last. Beautiful work.",
  },
  {
    title: "You’re building a reputation with yourself",
    body: "Today you kept a promise. That compounds.",
  },
  {
    title: "Checklist cleared",
    body: "Math to biology — you walked the whole path. Rest a little.",
  },
  {
    title: "Proud of you",
    body: "Emon would clap softly. We’re clapping loudly in here.",
  },
  {
    title: "Consistency looks this good",
    body: "One finished day. Then another. That’s how dreams get practical.",
  },
  {
    title: "You finished strong",
    body: "Even the last block got your attention. That’s grit.",
  },
  {
    title: "All tasks done",
    body: "Your future patients / peers just got a tiny bit luckier.",
  },
  {
    title: "Soft landing unlocked",
    body: "Close the notebook gently. You earned the quiet.",
  },
  {
    title: "What a day",
    body: "Timed blocks respected. Tags conquered. You, glowing.",
  },
  {
    title: "Great job, truly",
    body: "Not almost. Not mostly. All of it. Celebrate that.",
  },
  {
    title: "Discipline with kindness",
    body: "You pushed without punishing yourself. That’s mastery.",
  },
  {
    title: "Plan → done",
    body: "The diary asked. You answered with every checkmark.",
  },
  {
    title: "Stars for Arin",
    body: "Full plan days feel rare until they become your normal.",
  },
  {
    title: "You kept the streak of courage",
    body: "Starting was hard. Finishing was yours.",
  },
  {
    title: "Closed the loop",
    body: "Morning intention, evening completion. Perfect arc.",
  },
  {
    title: "Brilliant work",
    body: "Your checklist looks like a love letter to your goals.",
  },
  {
    title: "That’s a wrap",
    body: "Water, stretch, breathe. The hard part already happened.",
  },
  {
    title: "You showed up for every block",
    body: "Not one orphaned task. That’s how trust in yourself grows.",
  },
  {
    title: "Victory, quietly",
    body: "No fireworks needed — just five honest checkmarks.",
  },
  {
    title: "Exam-season legend mode",
    body: "Today’s effort is tomorrow’s calm in the hall.",
  },
  {
    title: "You were so good today",
    body: "Hard subjects. Soft heart. Finished list. Chef’s kiss.",
  },
  {
    title: "Mission complete",
    body: "The diary can rest. So can you — for a little while.",
  },
  {
    title: "All clear",
    body: "From first hour to last revision — you stayed with yourself.",
  },
  {
    title: "Deserving of cake (or tea)",
    body: "Pick a tiny treat. Study points aren’t the only reward.",
  },
  {
    title: "Another day you didn’t quit",
    body: "That’s the whole secret, wrapped in a completed plan.",
  },
  {
    title: "You did a great job",
    body: "Different day, same truth: Arin finishes what she starts.",
  },
] as const;

export function dayCompleteMessage(dateStr: string) {
  const idx = messageDayIndex(dateStr) % DAY_COMPLETE_MESSAGES.length;
  return DAY_COMPLETE_MESSAGES[idx]!;
}

const SEEN_KEY = "arin-day-complete-seen";

export function hasSeenDayComplete(dateStr: string): boolean {
  if (typeof window === "undefined") return true;
  try {
    return localStorage.getItem(SEEN_KEY) === dateStr;
  } catch {
    return false;
  }
}

export function markDayCompleteSeen(dateStr: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SEEN_KEY, dateStr);
  } catch {
    /* ignore */
  }
}
