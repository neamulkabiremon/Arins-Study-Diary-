import { MongoClient, type Db, type Collection, GridFSBucket, ObjectId } from "mongodb";
import type {
  DailyPlanDoc,
  EncouragementDoc,
  RewardClaimDoc,
  UserDoc,
} from "./types.js";

let client: MongoClient | null = null;
let db: Db | null = null;

export function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.includes("YOUR_DB_PASSWORD")) {
    throw new Error(
      "MONGODB_URI is missing or still has YOUR_DB_PASSWORD placeholder",
    );
  }
  return uri;
}

export async function getDb(): Promise<Db> {
  if (db) return db;
  const uri = getMongoUri();
  const name = process.env.MONGODB_DB_NAME || "arins_study_diary";
  client = new MongoClient(uri, {
    // Fail fast in Lambda instead of hanging until API Gateway 30s timeout
    serverSelectionTimeoutMS: 8_000,
    connectTimeoutMS: 8_000,
  });
  await client.connect();
  db = client.db(name);
  await ensureIndexes(db);
  return db;
}

async function ensureIndexes(database: Db) {
  await database.collection<UserDoc>("users").createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { role: 1 }, unique: true },
  ]);
  await database.collection<DailyPlanDoc>("daily_plans").createIndexes([
    { key: { ownerId: 1, planDate: 1 }, unique: true },
  ]);
  // Points bank allows multiple claims per week; drop legacy unique if present
  try {
    await database.collection("reward_claims").dropIndex("ownerId_1_weekStart_1");
  } catch {
    /* index may not exist */
  }
  await database.collection<RewardClaimDoc>("reward_claims").createIndexes([
    { key: { ownerId: 1, claimedAt: -1 } },
    { key: { ownerId: 1, monthKey: 1, choice: 1 } },
  ]);
  await database.collection("daily_awards").createIndexes([
    { key: { ownerId: 1, awardDate: 1 }, unique: true },
  ]);
  await database.collection("mail_log").createIndexes([
    { key: { key: 1 }, unique: true },
    { key: { createdAt: -1 } },
  ]);
}

export async function users(): Promise<Collection<UserDoc>> {
  return (await getDb()).collection<UserDoc>("users");
}

export async function plans(): Promise<Collection<DailyPlanDoc>> {
  return (await getDb()).collection<DailyPlanDoc>("daily_plans");
}

export async function awards() {
  return (await getDb()).collection("daily_awards");
}

export async function claims(): Promise<Collection<RewardClaimDoc>> {
  return (await getDb()).collection<RewardClaimDoc>("reward_claims");
}

export async function notes(): Promise<Collection<EncouragementDoc>> {
  return (await getDb()).collection<EncouragementDoc>("encouragement_notes");
}

export async function photoBucket(): Promise<GridFSBucket> {
  const database = await getDb();
  return new GridFSBucket(database, { bucketName: "notebook_photos" });
}

export { ObjectId };
