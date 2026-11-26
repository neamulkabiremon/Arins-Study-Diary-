import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { dhakaDateString, monthStartDay, weekStartMonday } from "../dates.js";
import { json } from "../http.js";
import { awards, claims, notes, plans, users } from "../mongo.js";
import {
  EXTRA_DATE_COST,
  isDateChoice,
  monthKeyFromDate,
} from "../reward-rules.js";
import { getMonthEarned, getWallet } from "../wallet.js";

/** Wallet + weekly stars + date progress for Rewards page (own account). */
export async function handleGetWeekProgress(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const today = dhakaDateString();
  const weekStart = weekStartMonday(today);
  const monthKey = monthKeyFromDate(today);
  const monthStart = monthStartDay(today);
  const awardCol = await awards();
  const claimCol = await claims();

  const starRows = await awardCol
    .find({
      ownerId: user.id,
      studyStar: true,
      awardDate: { $gte: weekStart, $lte: today },
    })
    .project({ awardDate: 1 })
    .toArray();

  const starDays = starRows
    .map((r) => r.awardDate as string)
    .filter(Boolean)
    .sort();

  const starCount = starDays.length;
  const claim = await claimCol.findOne(
    { ownerId: user.id },
    { sort: { claimedAt: -1 } },
  );

  const wallet = await getWallet(user.id);
  const monthEarned = await getMonthEarned(user.id, monthStart, today);

  const dateChoice =
    user.role === "emon" ? "date_with_arin" : "date_with_emon";
  const dateClaim = await claimCol.findOne({
    ownerId: user.id,
    choice: dateChoice,
    monthKey,
  });
  const dateClaimedThisMonth = Boolean(dateClaim);
  const dateEligible =
    !dateClaimedThisMonth && wallet.balance >= EXTRA_DATE_COST;

  const recentClaims = await claimCol
    .find({ ownerId: user.id })
    .sort({ claimedAt: -1 })
    .limit(8)
    .toArray();

  return json(
    200,
    {
      weekStart,
      starDays,
      starCount,
      unlocked: wallet.balance >= 150,
      unlockedSoft: wallet.balance >= 150,
      unlockedMid: wallet.balance >= 1000,
      unlockedHigh: wallet.balance >= 2000,
      claimed: false,
      claimedChoice: claim?.choice ?? null,
      fulfilled: claim?.fulfilled ?? false,
      fullPlanDaysThisMonth: 0,
      dateClaimedThisMonth,
      dateEligible,
      dateMinFullPlans: 0,
      wallet,
      monthEarned,
      extraDateCost: EXTRA_DATE_COST,
      monthProgressPct: Math.min(
        100,
        Math.round((monthEarned / EXTRA_DATE_COST) * 100),
      ),
      recentClaims: recentClaims.map((c) => ({
        id: String(c._id),
        choice: c.choice,
        pointsSpent: c.pointsSpent ?? 0,
        tkAmount: c.tkAmount ?? null,
        claimedAt: c.claimedAt.toISOString(),
        fulfilled: c.fulfilled,
      })),
      claim: claim
        ? {
            id: String(claim._id),
            weekStart: claim.weekStart,
            choice: claim.choice,
            claimedAt: claim.claimedAt.toISOString(),
            fulfilled: claim.fulfilled,
            fulfilledAt: claim.fulfilledAt
              ? claim.fulfilledAt.toISOString()
              : null,
          }
        : null,
    },
    event,
  );
}

/** Partner's today plan + points (read-only sync for the duo). */
export async function handleGetPartnerToday(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const partnerRole = user.role === "arin" ? "emon" : "arin";
  const userCol = await users();
  const partner = await userCol.findOne({ role: partnerRole });
  if (!partner) {
    return json(404, { error: "Partner account not found" }, event);
  }
  const partnerId = String(partner._id);
  const { dhakaDateString } = await import("../dates.js");
  const planDate = dhakaDateString();
  const plan = await (await plans()).findOne({
    ownerId: partnerId,
    planDate,
    confirmed: true,
  });
  const wallet = await getWallet(partnerId);
  const monthKey = monthKeyFromDate(planDate);
  const dateChoice =
    partnerRole === "emon" ? "date_with_arin" : "date_with_emon";
  const dateClaim = await (await claims()).findOne({
    ownerId: partnerId,
    choice: dateChoice,
    monthKey,
  });

  return json(
    200,
    {
      planDate,
      partner: {
        id: partnerId,
        role: partnerRole,
        displayName:
          partner.displayName ||
          (partnerRole === "arin" ? "Arin Mahi" : "Emon"),
        email: partner.email,
        avatarDataUrl: partner.avatarDataUrl ?? null,
      },
      plan: plan
        ? {
            id: String(plan._id),
            planDate: plan.planDate,
            photoPath: plan.photoFileId ?? null,
            confirmed: plan.confirmed,
            tasks: (plan.tasks ?? []).map((t) => ({
              ...t,
              completedAt: t.completedAt
                ? t.completedAt instanceof Date
                  ? t.completedAt.toISOString()
                  : t.completedAt
                : null,
            })),
          }
        : null,
      wallet,
      dateClaimedThisMonth: Boolean(dateClaim),
      extraDateCost: EXTRA_DATE_COST,
    },
    event,
  );
}

export async function handleGetEmonDashboard(event: APIGatewayProxyEventV2) {
  await requireUser(event);
  const claimCol = await claims();
  const noteCol = await notes();

  const openClaims = await claimCol
    .find({ fulfilled: false })
    .sort({ claimedAt: -1 })
    .limit(20)
    .toArray();

  const recentNotes = await noteCol
    .find({})
    .sort({ createdAt: -1 })
    .limit(20)
    .toArray();

  return json(
    200,
    {
      claims: openClaims.map((c) => ({
        id: String(c._id),
        weekStart: c.weekStart,
        choice: c.choice,
        pointsSpent: c.pointsSpent ?? null,
        tkAmount: c.tkAmount ?? null,
        claimedAt: c.claimedAt.toISOString(),
        fulfilled: c.fulfilled,
        fulfilledAt: c.fulfilledAt ? c.fulfilledAt.toISOString() : null,
        isDate: isDateChoice(c.choice as "date_with_emon" | "date_with_arin"),
      })),
      notes: recentNotes.map((n) => ({
        id: String(n._id),
        body: n.body,
        createdAt: n.createdAt.toISOString(),
        createdBy: n.authorId,
      })),
    },
    event,
  );
}
