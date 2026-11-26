import type { ObjectId } from "mongodb";

export type UserRole = "arin" | "emon";

export type TaskTag = "HSC" | "Medical" | "Engineering";

export type RewardChoice =
  | "date_with_emon"
  | "date_with_arin"
  | "chocolate"
  | "outfit"
  | "cash"
  | "makeup"
  | "personal_gift";

export interface UserDoc {
  _id?: ObjectId;
  email: string;
  role: UserRole;
  displayName: string;
  passwordHash: string;
  /** Compressed JPEG/PNG data URL for profile photo (synced across devices). */
  avatarDataUrl?: string | null;
  createdAt: Date;
}

export interface StudyTaskDoc {
  id: string;
  title: string;
  tags: TaskTag[];
  isFrog: boolean;
  firstFiveMinutes?: string | null;
  completed: boolean;
  completedAt?: Date | null;
  uncertain: boolean;
  sortOrder: number;
  carriedFromDate?: string | null;
}

export interface DailyPlanDoc {
  _id?: ObjectId;
  ownerId: string;
  planDate: string;
  photoFileId?: string | null;
  confirmed: boolean;
  tasks: StudyTaskDoc[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DailyAwardDoc {
  _id?: ObjectId;
  ownerId: string;
  awardDate: string;
  score: number;
  studyStar: boolean;
  fullPlan: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RewardClaimDoc {
  _id?: ObjectId;
  ownerId: string;
  weekStart: string;
  /** YYYY-MM Dhaka — Extra Date once per month */
  monthKey?: string;
  choice: RewardChoice;
  /** Points deducted from wallet */
  pointsSpent?: number;
  /** For cash: Tk to give (1 point = 1 Tk) */
  tkAmount?: number | null;
  note?: string | null;
  paymentMethod?: string | null;
  paymentNumber?: string | null;
  claimedAt: Date;
  fulfilled: boolean;
  fulfilledAt?: Date | null;
  fulfilledBy?: string | null;
}

export interface EncouragementDoc {
  _id?: ObjectId;
  authorId: string;
  /** Stored for quick UI; older rows may omit — list hydrates from users. */
  authorRole?: UserRole;
  authorName?: string;
  body: string;
  createdAt: Date;
}
