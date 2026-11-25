import { awards, claims } from "./mongo.js";

/** Lifetime earned (sum of daily scores) minus spent redemptions. */
export async function getWallet(ownerId: string): Promise<{
  earned: number;
  spent: number;
  balance: number;
}> {
  const awardCol = await awards();
  const claimCol = await claims();

  const earnedRows = await awardCol
    .aggregate<{ total: number }>([
      { $match: { ownerId } },
      { $group: { _id: null, total: { $sum: "$score" } } },
    ])
    .toArray();

  const spentRows = await claimCol
    .aggregate<{ total: number }>([
      { $match: { ownerId } },
      { $group: { _id: null, total: { $sum: "$pointsSpent" } } },
    ])
    .toArray();

  const earned = Math.round(earnedRows[0]?.total ?? 0);
  const spent = Math.round(spentRows[0]?.total ?? 0);
  return { earned, spent, balance: Math.max(0, earned - spent) };
}

export async function getMonthEarned(
  ownerId: string,
  monthStart: string,
  today: string,
): Promise<number> {
  const awardCol = await awards();
  const rows = await awardCol
    .aggregate<{ total: number }>([
      {
        $match: {
          ownerId,
          awardDate: { $gte: monthStart, $lte: today },
        },
      },
      { $group: { _id: null, total: { $sum: "$score" } } },
    ])
    .toArray();
  return Math.round(rows[0]?.total ?? 0);
}
