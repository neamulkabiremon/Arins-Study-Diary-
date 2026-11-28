export type TaskTag =
  | "HSC"
  | "Medical"
  | "Engineering"
  | "Work"
  | "Gym"
  | "Language"
  | "Reading"
  | "Personal";

/** Arin study track vs Emon professional / life track */
export const ARIN_TAGS: TaskTag[] = [
  "HSC",
  "Medical",
  "Engineering",
  "Language",
  "Personal",
];
export const EMON_TAGS: TaskTag[] = [
  "Work",
  "Gym",
  "Language",
  "Reading",
  "Personal",
];
export const ALL_TASK_TAGS: TaskTag[] = [
  "HSC",
  "Medical",
  "Engineering",
  "Work",
  "Gym",
  "Language",
  "Reading",
  "Personal",
];

export type RewardChoice =
  | "date_with_emon"
  | "date_with_arin"
  | "chocolate"
  | "outfit"
  | "cash"
  | "makeup"
  | "personal_gift";

export type UserRole = "arin" | "emon";

export interface StudyTask {
  id: string;
  title: string;
  tags: TaskTag[];
  isFrog: boolean;
  firstFiveMinutes?: string | null;
  completed: boolean;
  completedAt?: string | null;
  uncertain: boolean;
  sortOrder: number;
  carriedFromDate?: string | null;
}

export interface DailyPlan {
  id: string;
  planDate: string; // YYYY-MM-DD in Asia/Dhaka
  photoPath?: string | null;
  photoUrl?: string | null;
  confirmed: boolean;
  tasks: StudyTask[];
  createdAt: string;
  updatedAt: string;
}

export interface ScoreBreakdown {
  total: number;
  frogPoints: number;
  frogEarned: number;
  otherTaskPoints: number;
  otherTasksEarned: number;
  completedCount: number;
  totalCount: number;
  studyStar: boolean;
  fullPlan: boolean;
  hasPlan: boolean;
}

export interface MotivationalMessage {
  id: number;
  text: string;
  action: string;
  /** Book + author attribution */
  source: string;
}

export interface PointsWallet {
  earned: number;
  spent: number;
  balance: number;
}

export interface RewardRedemption {
  id: string;
  choice: RewardChoice;
  pointsSpent: number;
  tkAmount?: number | null;
  claimedAt: string;
  fulfilled: boolean;
}

export interface WeeklyRewardProgress {
  weekStart: string;
  starDays: string[];
  starCount: number;
  unlocked: boolean;
  unlockedSoft: boolean;
  unlockedMid: boolean;
  unlockedHigh: boolean;
  claimed: boolean;
  claimedChoice?: RewardChoice | null;
  fulfilled: boolean;
  fullPlanDaysThisMonth: number;
  dateClaimedThisMonth: boolean;
  dateEligible: boolean;
  dateMinFullPlans: number;
  wallet: PointsWallet;
  monthEarned: number;
  extraDateCost: number;
  monthProgressPct: number;
  recentClaims: RewardRedemption[];
}

export interface EncouragementNote {
  id: string;
  body: string;
  createdAt: string;
  createdBy: string;
  authorRole?: UserRole | null;
  authorName?: string | null;
}

export interface RewardClaim {
  id: string;
  weekStart: string;
  choice: RewardChoice;
  claimedAt: string;
  fulfilled: boolean;
  fulfilledAt?: string | null;
}

export interface ExtractedTaskDraft {
  clientId: string;
  title: string;
  tags: TaskTag[];
  isFrog: boolean;
  firstFiveMinutes?: string | null;
  uncertain: boolean;
  confidence?: number;
}

export interface ExtractResult {
  tasks: ExtractedTaskDraft[];
  notes?: string;
  provider: "openai" | "demo";
}

export interface DemoState {
  mode: "demo";
  today: DailyPlan | null;
  tomorrowDraft: {
    photoPreviewUrl: string | null;
    tasks: ExtractedTaskDraft[];
    extracting: boolean;
    extractError: string | null;
  };
  weekly: WeeklyRewardProgress;
  notes: EncouragementNote[];
  claims: RewardClaim[];
}
