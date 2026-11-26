import type {
  DailyPlan,
  EncouragementNote,
  ExtractedTaskDraft,
  RewardClaim,
  WeeklyRewardProgress,
} from "./types";
import {
  dhakaDateString,
  dhakaTomorrowString,
  weekDayStrings,
  weekStartMonday,
} from "./dates";

/** Placeholder SVG used instead of real notebook photos in demo mode. */
export const DEMO_NOTEBOOK_SVG = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="640" height="800" viewBox="0 0 640 800">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fffdf8"/>
      <stop offset="100%" stop-color="#f3e8d8"/>
    </linearGradient>
  </defs>
  <rect width="640" height="800" fill="#e8dff0"/>
  <rect x="70" y="40" width="500" height="720" rx="8" fill="url(#paper)" stroke="#c4b0d9" stroke-width="2"/>
  <g stroke="#d4c4b0" stroke-width="1">
    ${Array.from({ length: 22 }, (_, i) => `<line x1="100" y1="${110 + i * 28}" x2="540" y2="${110 + i * 28}"/>`).join("")}
  </g>
  <g fill="none" stroke="#5a4a3a" stroke-width="2.2" stroke-linecap="round">
    <path d="M120 130 C180 120, 240 145, 300 135"/>
    <path d="M120 185 C200 175, 280 200, 360 188"/>
    <path d="M120 240 C190 230, 250 255, 320 245"/>
    <path d="M120 295 C210 285, 300 310, 400 298"/>
    <path d="M120 350 C175 342, 230 365, 290 352"/>
  </g>
  <text x="120" y="70" fill="#7d5ba6" font-family="Georgia, serif" font-size="22">Demo notebook</text>
  <text x="120" y="740" fill="#6b6178" font-family="sans-serif" font-size="16">Labeled demo — not a real photo</text>
</svg>
`)}`;

export function createDemoTodayPlan(now = new Date()): DailyPlan {
  const planDate = dhakaDateString(now);
  return {
    id: "demo-plan-today",
    planDate,
    photoPath: null,
    photoUrl: DEMO_NOTEBOOK_SVG,
    confirmed: true,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    tasks: [
      {
        id: "demo-task-1",
        title: "Solve 20 Physics MCQs",
        tags: ["HSC", "Engineering"],
        isFrog: true,
        firstFiveMinutes: "Open chapter 5 and try the first 2",
        completed: true,
        completedAt: now.toISOString(),
        uncertain: false,
        sortOrder: 0,
      },
      {
        id: "demo-task-2",
        title: "Revise Biology chapter 3 notes",
        tags: ["HSC", "Medical"],
        isFrog: false,
        firstFiveMinutes: null,
        completed: true,
        completedAt: now.toISOString(),
        uncertain: false,
        sortOrder: 1,
      },
      {
        id: "demo-task-3",
        title: "Chemistry short questions — set A",
        tags: ["HSC", "Medical", "Engineering"],
        isFrog: false,
        firstFiveMinutes: null,
        completed: false,
        completedAt: null,
        uncertain: false,
        sortOrder: 2,
      },
    ],
  };
}

export function createDemoDraftTasks(): ExtractedTaskDraft[] {
  return [
    {
      clientId: "draft-1",
      title: "Solve 20 Physics MCQs",
      tags: ["HSC", "Engineering"],
      isFrog: true,
      firstFiveMinutes: "Open chapter 5 and try the first 2",
      uncertain: false,
      confidence: 0.92,
    },
    {
      clientId: "draft-2",
      title: "Revise Biology chapter 3 notes",
      tags: ["HSC", "Medical"],
      isFrog: false,
      firstFiveMinutes: null,
      uncertain: false,
      confidence: 0.88,
    },
    {
      clientId: "draft-3",
      title: "Chemistry short questions — set A?",
      tags: ["HSC"],
      isFrog: false,
      firstFiveMinutes: null,
      uncertain: true,
      confidence: 0.45,
    },
  ];
}

export function createEmptyWeekly(now = new Date()): WeeklyRewardProgress {
  const today = dhakaDateString(now);
  return {
    weekStart: weekStartMonday(today),
    starDays: [],
    starCount: 0,
    unlocked: false,
    unlockedSoft: false,
    unlockedMid: false,
    unlockedHigh: false,
    claimed: false,
    claimedChoice: null,
    fulfilled: false,
    fullPlanDaysThisMonth: 0,
    dateClaimedThisMonth: false,
    dateEligible: false,
    dateMinFullPlans: 0,
    wallet: { earned: 0, spent: 0, balance: 0 },
    monthEarned: 0,
    extraDateCost: 3000,
    monthProgressPct: 0,
    recentClaims: [],
  };
}

export function createDemoWeekly(now = new Date()): WeeklyRewardProgress {
  const today = dhakaDateString(now);
  const weekStart = weekStartMonday(today);
  const stars = weekDayStrings(today)
    .slice(0, 5)
    .filter((d) => d <= today)
    .slice(0, 3);
  const balance = 420;

  return {
    weekStart,
    starDays: stars,
    starCount: stars.length,
    unlocked: true,
    unlockedSoft: true,
    unlockedMid: true,
    unlockedHigh: false,
    claimed: false,
    claimedChoice: null,
    fulfilled: false,
    fullPlanDaysThisMonth: 1,
    dateClaimedThisMonth: false,
    dateEligible: false,
    dateMinFullPlans: 0,
    wallet: { earned: 520, spent: 100, balance },
    monthEarned: 520,
    extraDateCost: 3000,
    monthProgressPct: Math.round((520 / 3000) * 100),
    recentClaims: [],
  };
}

export function createDemoNotes(): EncouragementNote[] {
  const now = Date.now();
  return [
    {
      id: "demo-note-1",
      body: "Proud of you for showing up today. One Frog at a time — I've got the tea ready when you finish.",
      createdAt: new Date(now - 3600_000).toISOString(),
      createdBy: "emon",
      authorRole: "emon",
      authorName: "Emon",
    },
    {
      id: "demo-note-2",
      body: "Thank you 🤍 Studying my Frog now. Love you.",
      createdAt: new Date(now - 1800_000).toISOString(),
      createdBy: "arin",
      authorRole: "arin",
      authorName: "Arin Mahi",
    },
  ];
}

export function createDemoClaims(): RewardClaim[] {
  return [];
}

export function demoTomorrowLabel(now = new Date()): string {
  return dhakaTomorrowString(now);
}

export const DEMO_BANNER =
  "Demo mode — labeled sample data. No credentials required.";
