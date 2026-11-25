"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createDemoClaims,
  createDemoDraftTasks,
  createDemoNotes,
  createDemoTodayPlan,
  createDemoWeekly,
  createEmptyWeekly,
  DEMO_BANNER,
  DEMO_NOTEBOOK_SVG,
} from "@/lib/demo-data";
import {
  apiGetPhoto,
  apiGetTodayPlan,
  apiGetTomorrowPlan,
  apiGetWeekProgress,
  apiListNotes,
  apiToggleTask,
  hasApiBaseUrl,
} from "@/lib/api";
import {
  dhakaDateString,
  dhakaTomorrowString,
  weekStartMonday,
} from "@/lib/dates";
import { scoreFromPlan } from "@/lib/scoring";
import { isLoggedIn } from "@/lib/session";
import type {
  DailyPlan,
  EncouragementNote,
  ExtractedTaskDraft,
  RewardChoice,
  RewardClaim,
  ScoreBreakdown,
  StudyTask,
  WeeklyRewardProgress,
} from "@/lib/types";

async function withPhotoUrl(plan: DailyPlan | null): Promise<DailyPlan | null> {
  if (!plan) return null;
  if (plan.photoUrl) return plan;
  if (!plan.photoPath) return { ...plan, photoUrl: null };
  try {
    const photo = await apiGetPhoto(plan.photoPath);
    return { ...plan, photoUrl: photo.dataUrl };
  } catch {
    return { ...plan, photoUrl: null };
  }
}

function planTasksToDrafts(plan: DailyPlan): ExtractedTaskDraft[] {
  return plan.tasks.map((t) => ({
    clientId: t.id,
    title: t.title,
    tags: t.tags,
    isFrog: t.isFrog,
    firstFiveMinutes: t.firstFiveMinutes ?? null,
    uncertain: t.uncertain,
  }));
}

function weekFromApi(weekRes: {
  weekStart: string;
  starDays: string[];
  starCount: number;
  unlocked: boolean;
  unlockedSoft?: boolean;
  unlockedMid?: boolean;
  unlockedHigh?: boolean;
  claimed: boolean;
  claimedChoice: RewardChoice | null;
  fulfilled: boolean;
  fullPlanDaysThisMonth?: number;
  dateClaimedThisMonth?: boolean;
  dateEligible?: boolean;
  dateMinFullPlans?: number;
  wallet?: { earned: number; spent: number; balance: number };
  monthEarned?: number;
  extraDateCost?: number;
  monthProgressPct?: number;
  recentClaims?: WeeklyRewardProgress["recentClaims"];
}): WeeklyRewardProgress {
  const starCount = weekRes.starCount;
  const empty = {
    earned: 0,
    spent: 0,
    balance: 0,
  };
  return {
    weekStart: weekRes.weekStart,
    starDays: weekRes.starDays,
    starCount,
    unlocked: weekRes.unlocked,
    unlockedSoft: weekRes.unlockedSoft ?? false,
    unlockedMid: weekRes.unlockedMid ?? false,
    unlockedHigh: weekRes.unlockedHigh ?? false,
    claimed: weekRes.claimed,
    claimedChoice: weekRes.claimedChoice,
    fulfilled: weekRes.fulfilled,
    fullPlanDaysThisMonth: weekRes.fullPlanDaysThisMonth ?? 0,
    dateClaimedThisMonth: weekRes.dateClaimedThisMonth ?? false,
    dateEligible: weekRes.dateEligible ?? false,
    dateMinFullPlans: weekRes.dateMinFullPlans ?? 0,
    wallet: weekRes.wallet ?? empty,
    monthEarned: weekRes.monthEarned ?? 0,
    extraDateCost: weekRes.extraDateCost ?? 3000,
    monthProgressPct: weekRes.monthProgressPct ?? 0,
    recentClaims: weekRes.recentClaims ?? [],
  };
}

const STORAGE_KEY = "arin-study-diary-demo-v2";

interface DiaryContextValue {
  demoMode: boolean;
  demoBanner: string | null;
  todayDate: string;
  tomorrowDate: string;
  todayPlan: DailyPlan | null;
  tomorrowDraft: {
    photoPreviewUrl: string | null;
    tasks: ExtractedTaskDraft[];
    extracting: boolean;
    extractError: string | null;
    confirmedPlan: DailyPlan | null;
  };
  score: ScoreBreakdown;
  weekly: WeeklyRewardProgress;
  notes: EncouragementNote[];
  claims: RewardClaim[];
  tick: number;
  /** Prefer setTaskCompleted so iPad double-taps don't flip back. */
  setTaskCompleted: (taskId: string, completed: boolean) => void;
  toggleTask: (taskId: string) => void;
  refreshLive: () => Promise<void>;
  setDraftTasks: (tasks: ExtractedTaskDraft[]) => void;
  setDraftPhoto: (url: string | null) => void;
  setExtracting: (v: boolean) => void;
  setExtractError: (msg: string | null) => void;
  mergeExtractedTasks: (incoming: ExtractedTaskDraft[]) => void;
  confirmTomorrowPlan: () => void;
  claimReward: (choice: RewardChoice, amount?: number) => void;
  refreshRewards: () => Promise<void>;
  addNote: (body: string) => void;
  fulfillClaim: (id: string) => void;
  carryForwardUnfinished: () => void;
  resetDemo: () => void;
}

const DiaryContext = createContext<DiaryContextValue | null>(null);

function loadDemoState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      todayPlan: DailyPlan | null;
      draftTasks: ExtractedTaskDraft[];
      photoPreviewUrl: string | null;
      confirmedTomorrow: DailyPlan | null;
      weekly: WeeklyRewardProgress;
      notes: EncouragementNote[];
      claims: RewardClaim[];
      savedTodayDate: string;
    };
  } catch {
    return null;
  }
}

export function DiaryProvider({
  children,
  demoMode,
}: {
  children: ReactNode;
  demoMode: boolean;
}) {
  const [tick, setTick] = useState(0);
  const [todayPlan, setTodayPlan] = useState<DailyPlan | null>(() =>
    demoMode ? createDemoTodayPlan() : null,
  );
  const [draftTasks, setDraftTasks] = useState<ExtractedTaskDraft[]>(() =>
    demoMode ? createDemoDraftTasks() : [],
  );
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(() =>
    demoMode ? DEMO_NOTEBOOK_SVG : null,
  );
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [confirmedTomorrow, setConfirmedTomorrow] = useState<DailyPlan | null>(
    null,
  );
  const [weekly, setWeekly] = useState<WeeklyRewardProgress>(() =>
    demoMode ? createDemoWeekly() : createEmptyWeekly(),
  );
  const [notes, setNotes] = useState<EncouragementNote[]>(() =>
    demoMode ? createDemoNotes() : [],
  );
  const [claims, setClaims] = useState<RewardClaim[]>(() =>
    demoMode ? createDemoClaims() : [],
  );
  const [hydrated, setHydrated] = useState(false);

  // Recompute when `tick` bumps (midnight rollover while the app stays open)
  const todayDate = dhakaDateString();
  const tomorrowDate = dhakaTomorrowString();

  // Midnight / calendar rollover: recompute Dhaka dates every minute
  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateLive() {
      if (!hasApiBaseUrl() || !isLoggedIn()) {
        if (!cancelled) setHydrated(true);
        return;
      }
      try {
        const [todayRes, tomorrowRes, weekRes, notesRes] = await Promise.all([
          apiGetTodayPlan(),
          apiGetTomorrowPlan(),
          apiGetWeekProgress(),
          apiListNotes(),
        ]);
        if (cancelled) return;
        const today = await withPhotoUrl(todayRes.plan);
        const tomorrow = await withPhotoUrl(tomorrowRes.plan);
        if (cancelled) return;
        setTodayPlan(today);
        // Banner / “plan ready” only for confirmed plans
        setConfirmedTomorrow(tomorrow?.confirmed ? tomorrow : null);
        if (tomorrow?.photoUrl) setPhotoPreviewUrl(tomorrow.photoUrl);
        // Restore editable checklist + photo from Mongo after refresh
        if (tomorrow && tomorrow.tasks.length > 0) {
          setDraftTasks(planTasksToDrafts(tomorrow));
        }
        setWeekly(weekFromApi(weekRes));
        if (weekRes.claim) {
          setClaims([weekRes.claim]);
        }
        setNotes(notesRes.notes ?? []);
      } catch {
        // Keep empty state; pages show errors on actions
      } finally {
        if (!cancelled) setHydrated(true);
      }
    }

    if (!demoMode) {
      void hydrateLive();
      return () => {
        cancelled = true;
      };
    }

    const saved = loadDemoState();
    const today = dhakaDateString();
    if (saved) {
      // If calendar day rolled over while app was open / closed
      if (saved.savedTodayDate !== today) {
        // Confirmed tomorrow becomes today if it matches
        let nextToday = createDemoTodayPlan();
        if (
          saved.confirmedTomorrow &&
          saved.confirmedTomorrow.planDate === today
        ) {
          nextToday = saved.confirmedTomorrow;
        } else if (saved.todayPlan) {
          // Carry unfinished into a fresh day record without rewriting old day
          const unfinished = saved.todayPlan.tasks
            .filter((t) => !t.completed)
            .map((t, i) => ({
              ...t,
              id: `carried-${t.id}-${today}`,
              completed: false,
              completedAt: null,
              carriedFromDate: saved.todayPlan!.planDate,
              sortOrder: i,
            }));
          nextToday = {
            id: `plan-${today}`,
            planDate: today,
            photoPath: null,
            photoUrl: DEMO_NOTEBOOK_SVG,
            confirmed: unfinished.length > 0,
            tasks: unfinished,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
        setTodayPlan(nextToday);
        setConfirmedTomorrow(null);
        setDraftTasks(createDemoDraftTasks());
        setPhotoPreviewUrl(DEMO_NOTEBOOK_SVG);
        setWeekly(createDemoWeekly());
        setNotes(saved.notes ?? createDemoNotes());
        setClaims(saved.claims ?? []);
      } else {
        setTodayPlan(saved.todayPlan);
        setDraftTasks(saved.draftTasks);
        setPhotoPreviewUrl(saved.photoPreviewUrl);
        setConfirmedTomorrow(saved.confirmedTomorrow);
        setWeekly({ ...createEmptyWeekly(), ...saved.weekly });
        setNotes(saved.notes);
        setClaims(saved.claims);
      }
    }
    setHydrated(true);
  }, [demoMode]);

  // Live mode: when Dhaka calendar day changes, reload Today from Mongo
  const prevTodayRef = useRef(todayDate);
  useEffect(() => {
    if (demoMode || !hydrated || !hasApiBaseUrl() || !isLoggedIn()) return;
    if (prevTodayRef.current === todayDate) return;
    prevTodayRef.current = todayDate;
    let cancelled = false;
    void (async () => {
      try {
        const [todayRes, tomorrowRes, weekRes] = await Promise.all([
          apiGetTodayPlan(),
          apiGetTomorrowPlan(),
          apiGetWeekProgress(),
        ]);
        if (cancelled) return;
        const tomorrow = await withPhotoUrl(tomorrowRes.plan);
        setTodayPlan(await withPhotoUrl(todayRes.plan));
        setConfirmedTomorrow(tomorrow?.confirmed ? tomorrow : null);
        if (tomorrow?.photoUrl) setPhotoPreviewUrl(tomorrow.photoUrl);
        if (tomorrow && tomorrow.tasks.length > 0) {
          setDraftTasks(planTasksToDrafts(tomorrow));
        }
        setWeekly(weekFromApi(weekRes));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [demoMode, hydrated, todayDate]);

  // Persist demo state
  useEffect(() => {
    if (!demoMode || !hydrated) return;
    const payload = {
      todayPlan,
      draftTasks,
      photoPreviewUrl,
      confirmedTomorrow,
      weekly,
      notes,
      claims,
      savedTodayDate: todayDate,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    demoMode,
    hydrated,
    todayPlan,
    draftTasks,
    photoPreviewUrl,
    confirmedTomorrow,
    weekly,
    notes,
    claims,
    todayDate,
    tick,
  ]);

  // If confirmed tomorrow's date is now today (midnight rollover while open)
  useEffect(() => {
    if (!confirmedTomorrow) return;
    if (confirmedTomorrow.planDate === todayDate) {
      setTodayPlan(confirmedTomorrow);
      setConfirmedTomorrow(null);
    }
  }, [confirmedTomorrow, todayDate, tick]);

  const score = useMemo(() => scoreFromPlan(todayPlan), [todayPlan]);

  // Update weekly stars when score crosses 50 / drops below
  useEffect(() => {
    if (!demoMode || !hydrated) return;
    setWeekly((prev) => {
      const hasStar = prev.starDays.includes(todayDate);
      if (score.studyStar && !hasStar) {
        const starDays = [...prev.starDays, todayDate].sort();
        const n = starDays.length;
        return {
          ...prev,
          starDays,
          starCount: n,
          unlocked: n >= 3,
          unlockedSoft: n >= 3,
          unlockedMid: n >= 4,
          unlockedHigh: n >= 5,
        };
      }
      if (!score.studyStar && hasStar && !prev.claimed) {
        const starDays = prev.starDays.filter((d) => d !== todayDate);
        const n = starDays.length;
        return {
          ...prev,
          starDays,
          starCount: n,
          unlocked: n >= 3,
          unlockedSoft: n >= 3,
          unlockedMid: n >= 4,
          unlockedHigh: n >= 5,
        };
      }
      return prev;
    });
  }, [score.studyStar, todayDate, demoMode, hydrated]);

  const refreshLive = useCallback(async () => {
    if (demoMode || !hasApiBaseUrl() || !isLoggedIn()) return;
    try {
      const [todayRes, tomorrowRes, weekRes] = await Promise.all([
        apiGetTodayPlan(),
        apiGetTomorrowPlan(),
        apiGetWeekProgress(),
      ]);
      const tomorrow = await withPhotoUrl(tomorrowRes.plan);
      setTodayPlan(await withPhotoUrl(todayRes.plan));
      setConfirmedTomorrow(tomorrow?.confirmed ? tomorrow : null);
      if (tomorrow?.photoUrl) setPhotoPreviewUrl(tomorrow.photoUrl);
      if (tomorrow && tomorrow.tasks.length > 0) {
        setDraftTasks(planTasksToDrafts(tomorrow));
      }
      setWeekly(weekFromApi(weekRes));
    } catch {
      /* ignore */
    }
  }, [demoMode]);

  // Sync when returning to the app (iPad / iPhone / Android / Mac)
  useEffect(() => {
    if (demoMode || !hydrated) return;
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshLive();
    };
    const onFocus = () => void refreshLive();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", onFocus);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", onFocus);
    };
  }, [demoMode, hydrated, refreshLive]);

  const setTaskCompleted = useCallback(
    (taskId: string, completed: boolean) => {
      setTodayPlan((plan) => {
        if (!plan) return plan;
        const current = plan.tasks.find((t) => t.id === taskId);
        if (!current || current.completed === completed) return plan;
        return {
          ...plan,
          tasks: plan.tasks.map((t) =>
            t.id !== taskId
              ? t
              : {
                  ...t,
                  completed,
                  completedAt: completed ? new Date().toISOString() : null,
                },
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      // Check → points up; uncheck → points down. Saved in Mongo.
      if (!demoMode && hasApiBaseUrl() && isLoggedIn()) {
        void apiToggleTask(taskId, completed)
          .then(async (res) => {
            if (res.wallet) {
              setWeekly((w) => ({
                ...w,
                wallet: res.wallet!,
                unlocked: res.wallet!.balance >= 150,
                unlockedSoft: res.wallet!.balance >= 150,
                unlockedMid: res.wallet!.balance >= 250,
                unlockedHigh: res.wallet!.balance >= 800,
              }));
            }
            const week = await apiGetWeekProgress();
            setWeekly(weekFromApi(week));
          })
          .catch(() => {
            void refreshLive();
          });
      }
    },
    [demoMode, refreshLive],
  );

  const toggleTask = useCallback(
    (taskId: string) => {
      const current = todayPlan?.tasks.find((t) => t.id === taskId);
      if (!current) return;
      setTaskCompleted(taskId, !current.completed);
    },
    [todayPlan, setTaskCompleted],
  );

  const mergeExtractedTasks = useCallback((incoming: ExtractedTaskDraft[]) => {
    setDraftTasks((prev) => {
      const existingTitles = new Set(
        prev.map((t) => t.title.trim().toLowerCase()),
      );
      const merged = [...prev];
      for (const task of incoming) {
        const key = task.title.trim().toLowerCase();
        if (existingTitles.has(key)) continue;
        merged.push(task);
        existingTitles.add(key);
      }
      return merged;
    });
  }, []);

  const confirmTomorrowPlan = useCallback(() => {
    const tasks: StudyTask[] = draftTasks.map((t, i) => ({
      id: `tomorrow-${t.clientId}`,
      title: t.title,
      tags: t.tags,
      isFrog: t.isFrog,
      firstFiveMinutes: t.firstFiveMinutes ?? null,
      completed: false,
      completedAt: null,
      uncertain: t.uncertain,
      sortOrder: i,
    }));
    // Ensure exactly one frog if any tasks
    if (tasks.length > 0 && !tasks.some((t) => t.isFrog)) {
      tasks[0]!.isFrog = true;
    }
    const plan: DailyPlan = {
      id: `plan-${tomorrowDate}`,
      planDate: tomorrowDate,
      photoPath: null,
      photoUrl: photoPreviewUrl,
      confirmed: true,
      tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConfirmedTomorrow(plan);
    // Also mirror onto Today so dashboard (Frog / checklist / photo) is testable now
    setTodayPlan({
      ...plan,
      id: `plan-${todayDate}`,
      planDate: todayDate,
    });
    // Refresh from API so task IDs match Mongo (needed for toggleTask)
    if (!demoMode && hasApiBaseUrl() && isLoggedIn()) {
      void apiGetTomorrowPlan()
        .then((r) => withPhotoUrl(r.plan))
        .then((p) => {
          if (p?.confirmed) setConfirmedTomorrow(p);
        })
        .catch(() => undefined);
      void apiGetTodayPlan()
        .then((r) => withPhotoUrl(r.plan))
        .then((p) => {
          if (p) setTodayPlan(p);
        })
        .catch(() => undefined);
    }
  }, [draftTasks, photoPreviewUrl, tomorrowDate, todayDate, demoMode]);

  const refreshRewards = useCallback(async () => {
    if (demoMode || !hasApiBaseUrl() || !isLoggedIn()) return;
    try {
      const week = await apiGetWeekProgress();
      setWeekly(weekFromApi(week));
      if (week.recentClaims) {
        setClaims(
          week.recentClaims.map((c) => ({
            id: c.id,
            weekStart: week.weekStart,
            choice: c.choice,
            claimedAt: c.claimedAt,
            fulfilled: c.fulfilled,
          })),
        );
      }
    } catch {
      /* ignore */
    }
  }, [demoMode]);

  const claimReward = useCallback(
    (choice: RewardChoice, amount?: number) => {
      const weekStart = weekStartMonday(todayDate);
      const claim: RewardClaim = {
        id: `claim-${Date.now()}`,
        weekStart,
        choice,
        claimedAt: new Date().toISOString(),
        fulfilled: false,
      };
      setClaims((c) => [claim, ...c]);
      setWeekly((w) => {
        const spend =
          choice === "cash"
            ? amount ?? 0
            : choice === "date_with_emon"
              ? w.extraDateCost
              : choice === "chocolate"
                ? 150
                : choice === "makeup"
                  ? 250
                  : choice === "outfit"
                    ? 800
                    : 1000;
        const balance = Math.max(0, w.wallet.balance - spend);
        return {
          ...w,
          claimedChoice: choice,
          dateClaimedThisMonth:
            choice === "date_with_emon" ? true : w.dateClaimedThisMonth,
          dateEligible:
            choice === "date_with_emon"
              ? false
              : !w.dateClaimedThisMonth && balance >= w.extraDateCost,
          wallet: {
            earned: w.wallet.earned,
            spent: w.wallet.spent + spend,
            balance,
          },
          recentClaims: [
            {
              id: claim.id,
              choice,
              pointsSpent: spend,
              tkAmount: choice === "cash" ? spend : null,
              claimedAt: claim.claimedAt,
              fulfilled: false,
            },
            ...w.recentClaims,
          ],
        };
      });
    },
    [todayDate],
  );

  const addNote = useCallback((body: string) => {
    setNotes((n) => [
      {
        id: `note-${Date.now()}`,
        body,
        createdAt: new Date().toISOString(),
        createdBy: "emon",
      },
      ...n,
    ]);
  }, []);

  const fulfillClaim = useCallback((id: string) => {
    setClaims((c) =>
      c.map((x) =>
        x.id === id
          ? { ...x, fulfilled: true, fulfilledAt: new Date().toISOString() }
          : x,
      ),
    );
  }, []);

  const carryForwardUnfinished = useCallback(() => {
    setTodayPlan((plan) => {
      if (!plan) return plan;
      return plan;
    });
  }, []);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setTodayPlan(createDemoTodayPlan());
    setDraftTasks(createDemoDraftTasks());
    setPhotoPreviewUrl(DEMO_NOTEBOOK_SVG);
    setConfirmedTomorrow(null);
    setWeekly(createDemoWeekly());
    setNotes(createDemoNotes());
    setClaims([]);
    setExtractError(null);
    setExtracting(false);
  }, []);

  const value: DiaryContextValue = {
    demoMode,
    demoBanner: demoMode ? DEMO_BANNER : null,
    todayDate,
    tomorrowDate,
    todayPlan,
    tomorrowDraft: {
      photoPreviewUrl,
      tasks: draftTasks,
      extracting,
      extractError,
      confirmedPlan: confirmedTomorrow,
    },
    score,
    weekly,
    notes,
    claims,
    tick,
    setTaskCompleted,
    toggleTask,
    refreshLive,
    setDraftTasks,
    setDraftPhoto: setPhotoPreviewUrl,
    setExtracting,
    setExtractError,
    mergeExtractedTasks,
    confirmTomorrowPlan,
    claimReward,
    refreshRewards,
    addNote,
    fulfillClaim,
    carryForwardUnfinished,
    resetDemo,
  };

  return (
    <DiaryContext.Provider value={value}>{children}</DiaryContext.Provider>
  );
}

export function useDiary() {
  const ctx = useContext(DiaryContext);
  if (!ctx) throw new Error("useDiary must be used within DiaryProvider");
  return ctx;
}
