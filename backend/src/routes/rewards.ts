import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { requireUser } from "../auth.js";
import { dhakaDateString, weekStartMonday } from "../dates.js";
import { json, parseJsonBody } from "../http.js";
import { claims, ObjectId } from "../mongo.js";
import {
  costForClaim,
  isDateChoice,
  monthKeyFromDate,
  type RewardChoice,
} from "../reward-rules.js";
import { claimSchema, fulfillSchema } from "../schema.js";
import { getWallet } from "../wallet.js";

export async function handleClaimReward(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const body = claimSchema.parse(parseJsonBody(event)) as {
    choice: RewardChoice;
    amount?: number;
    note?: string;
    paymentMethod?: string;
    paymentNumber?: string;
  };
  const { choice, amount, note, paymentMethod, paymentNumber } = body;
  const today = dhakaDateString();
  const weekStart = weekStartMonday(today);
  const monthKey = monthKeyFromDate(today);
  const claimCol = await claims();

  if (choice === "cash") {
    if (!paymentMethod || !paymentNumber?.trim()) {
      return json(
        400,
        {
          error:
            "For cash withdraw, add bKash/Rocket (or Nagad) and your number.",
        },
        event,
      );
    }
  }

  const priced = costForClaim(choice, amount, user.role);
  if (!priced.ok) {
    return json(400, { error: priced.error }, event);
  }

  const wallet = await getWallet(user.id);
  if (wallet.balance < priced.points) {
    return json(
      403,
      {
        error: `Not enough points. Need ${priced.points}, you have ${wallet.balance}.`,
        balance: wallet.balance,
        needed: priced.points,
      },
      event,
    );
  }

  if (isDateChoice(choice)) {
    const already = await claimCol.findOne({
      ownerId: user.id,
      choice,
      monthKey,
    });
    if (already) {
      return json(
        403,
        {
          error:
            "Extra study date is once per month — already claimed. Keep studying for next month!",
        },
        event,
      );
    }
  }

  try {
    const result = await claimCol.insertOne({
      ownerId: user.id,
      weekStart,
      monthKey,
      choice,
      pointsSpent: priced.points,
      tkAmount: priced.tk ?? null,
      note: note?.trim() || null,
      paymentMethod: paymentMethod ?? null,
      paymentNumber: paymentNumber?.trim() || null,
      claimedAt: new Date(),
      fulfilled: false,
      fulfilledAt: null,
      fulfilledBy: null,
    });

    const nextWallet = await getWallet(user.id);

    if (choice === "cash") {
      void import("../mail/smtp.js")
        .then(async ({ emonEmail, sendMail }) => {
          const { withdrawRequestEmail } = await import("../mail/templates.js");
          const mail = withdrawRequestEmail({
            amountTk: priced.tk ?? priced.points,
            pointsSpent: priced.points,
            note: note ?? null,
            paymentMethod: paymentMethod ?? null,
            paymentNumber: paymentNumber ?? null,
            balanceAfter: nextWallet.balance,
          });
          const to = emonEmail();
          if (!to) return;
          await sendMail({ to, ...mail });
        })
        .catch((err) => console.error("[mail] withdraw notify failed", err));
    }

    return json(
      200,
      {
        claim: {
          id: String(result.insertedId),
          weekStart,
          choice,
          pointsSpent: priced.points,
          tkAmount: priced.tk ?? null,
          claimedAt: new Date().toISOString(),
          fulfilled: false,
        },
        wallet: nextWallet,
      },
      event,
    );
  } catch (err) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return json(409, { error: "Could not record that claim." }, event);
    }
    throw err;
  }
}

export async function handleFulfillReward(event: APIGatewayProxyEventV2) {
  const user = await requireUser(event);
  const { claimId } = fulfillSchema.parse(parseJsonBody(event));
  const claimCol = await claims();

  let _id: ObjectId;
  try {
    _id = new ObjectId(claimId);
  } catch {
    return json(400, { error: "Invalid claim id" }, event);
  }

  const result = await claimCol.findOneAndUpdate(
    { _id },
    {
      $set: {
        fulfilled: true,
        fulfilledAt: new Date(),
        fulfilledBy: user.id,
      },
    },
    { returnDocument: "after" },
  );

  if (!result) {
    return json(404, { error: "Claim not found" }, event);
  }

  return json(
    200,
    {
      claim: {
        id: String(result._id),
        weekStart: result.weekStart,
        choice: result.choice,
        pointsSpent: result.pointsSpent ?? null,
        tkAmount: result.tkAmount ?? null,
        fulfilled: result.fulfilled,
      },
    },
    event,
  );
}
