/**
 * Client for the AWS Lambda API Gateway backend (MongoDB Atlas + Bedrock).
 */

import { getToken } from "@/lib/session";
import type {
  DailyPlan,
  EncouragementNote,
  ExtractedTaskDraft,
  PointsWallet,
  RewardChoice,
  RewardClaim,
  RewardRedemption,
} from "@/lib/types";

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, "");
  if (!base) {
    throw new Error("NEXT_PUBLIC_API_BASE_URL is not configured");
  }
  return base;
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function fileToBase64Payload(file: File): Promise<{
  mimeType: string;
  data: string;
}> {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const mimeType = file.type || "image/jpeg";
  return { mimeType, data: btoa(binary) };
}

export type ApiUser = {
  id: string;
  role: "arin" | "emon";
  email: string;
  displayName?: string;
  avatarDataUrl?: string | null;
};

export async function apiLogin(email: string, password: string) {
  const res = await fetch(`${apiBase()}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Login failed");
  return data as {
    token: string;
    user: ApiUser;
  };
}

export async function apiMe() {
  const res = await fetch(`${apiBase()}/auth/me`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load profile");
  return data as { user: ApiUser };
}

export async function apiUpdateAvatar(avatarDataUrl: string | null) {
  const res = await fetch(`${apiBase()}/auth/avatar`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ avatarDataUrl }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not save photo");
  return data as { ok: boolean; user: ApiUser };
}

export async function apiExtract(file: File) {
  const payload = await fileToBase64Payload(file);
  const res = await fetch(`${apiBase()}/extract`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Extraction failed");
  return data as {
    tasks: ExtractedTaskDraft[];
    notes?: string;
    provider: string;
    notice?: string;
  };
}

export async function apiUpload(file: File, planDate?: string) {
  const payload = await fileToBase64Payload(file);
  const res = await fetch(`${apiBase()}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ ...payload, planDate }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Upload failed");
  return data as {
    path: string;
    fileId?: string;
    planDate: string;
    folder: string;
    filename: string;
    signedUrl: string | null;
  };
}

export async function apiConfirmPlan(body: {
  planDate?: string;
  photoPath?: string | null;
  tasks: Array<{
    title: string;
    tags: Array<"HSC" | "Medical" | "Engineering">;
    isFrog: boolean;
    firstFiveMinutes?: string | null;
    uncertain?: boolean;
  }>;
}) {
  const res = await fetch(`${apiBase()}/plans/confirm`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not confirm plan");
  return data as { planId: string; planDate: string };
}

export async function apiGetTodayPlan() {
  const res = await fetch(`${apiBase()}/plans/today`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load today");
  return data as {
    plan: DailyPlan | null;
    planDate: string;
  };
}

export async function apiGetTomorrowPlan() {
  const res = await fetch(`${apiBase()}/plans/tomorrow`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load tomorrow");
  return data as {
    plan: DailyPlan | null;
    planDate: string;
  };
}

export async function apiGetPhoto(fileId: string) {
  const res = await fetch(`${apiBase()}/photos/${encodeURIComponent(fileId)}`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load photo");
  return data as { mimeType: string; dataUrl: string };
}

export async function apiToggleTask(taskId: string, completed: boolean) {
  const res = await fetch(`${apiBase()}/tasks/${taskId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ completed }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not update task");
  return data as {
    ok: boolean;
    planDate: string;
    score?: { total: number; studyStar: boolean; fullPlan: boolean };
    wallet?: PointsWallet;
  };
}

export async function apiClaimReward(
  choice: RewardChoice,
  amount?: number,
  extras?: {
    note?: string;
    paymentMethod?: "bkash" | "rocket" | "nagad" | "other";
    paymentNumber?: string;
  },
) {
  const res = await fetch(`${apiBase()}/rewards/claim`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({
      choice,
      amount,
      note: extras?.note,
      paymentMethod: extras?.paymentMethod,
      paymentNumber: extras?.paymentNumber,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not claim reward");
  return data as {
    claim: RewardClaim & {
      pointsSpent?: number;
      tkAmount?: number | null;
    };
    wallet?: PointsWallet;
  };
}

export async function apiFulfillReward(claimId: string) {
  const res = await fetch(`${apiBase()}/rewards/fulfill`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ claimId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not fulfill reward");
  return data;
}

export async function apiCreateNote(body: string) {
  const res = await fetch(`${apiBase()}/encouragement`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(),
    },
    body: JSON.stringify({ body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not save note");
  return data as {
    note: EncouragementNote;
  };
}

export async function apiListNotes() {
  const res = await fetch(`${apiBase()}/encouragement`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load notes");
  return data as {
    notes: EncouragementNote[];
  };
}

export async function apiGetWeekProgress() {
  const res = await fetch(`${apiBase()}/rewards/week`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load rewards");
  return data as {
    weekStart: string;
    starDays: string[];
    starCount: number;
    unlocked: boolean;
    unlockedSoft: boolean;
    unlockedMid: boolean;
    unlockedHigh: boolean;
    claimed: boolean;
    claimedChoice: RewardChoice | null;
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
    claim: RewardClaim | null;
  };
}

export async function apiGetPartnerToday() {
  const res = await fetch(`${apiBase()}/partner/today`, {
    headers: { ...authHeader() },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Could not load partner");
  return data as {
    planDate: string;
    partner: {
      id: string;
      role: "arin" | "emon";
      displayName: string;
      email: string;
      avatarDataUrl?: string | null;
    };
    plan: DailyPlan | null;
    wallet: PointsWallet;
    dateClaimedThisMonth: boolean;
    extraDateCost: number;
  };
}

export function hasApiBaseUrl(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
}
