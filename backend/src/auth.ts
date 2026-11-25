import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { bearerToken } from "./http.js";
import { users } from "./mongo.js";
import type { UserRole } from "./types.js";

export interface AuthUser {
  id: string;
  role: UserRole;
  email: string;
  displayName: string;
  avatarDataUrl?: string | null;
}

function jwtSecret() {
  const secret = process.env.APP_JWT_SECRET;
  if (!secret || secret.startsWith("change-me")) {
    throw new Error("APP_JWT_SECRET is not configured");
  }
  return new TextEncoder().encode(secret);
}

export async function ensureInviteUsers() {
  const col = await users();
  const seeds: Array<{
    email: string;
    password: string;
    role: UserRole;
    displayName: string;
  }> = [
    {
      email: (process.env.ARIN_EMAIL || "arin@example.com").toLowerCase(),
      password: process.env.ARIN_PASSWORD || "change-me-arin",
      role: "arin",
      displayName: "Arin Mahi",
    },
    {
      email: (process.env.EMON_EMAIL || "emon@example.com").toLowerCase(),
      password: process.env.EMON_PASSWORD || "change-me-emon",
      role: "emon",
      displayName: "Emon",
    },
  ];

  for (const seed of seeds) {
    const existing = await col.findOne({ role: seed.role });
    if (!existing) {
      const passwordHash = await bcrypt.hash(seed.password, 10);
      await col.insertOne({
        email: seed.email,
        role: seed.role,
        displayName: seed.displayName,
        passwordHash,
        createdAt: new Date(),
      });
      continue;
    }

    const emailChanged = existing.email !== seed.email;
    const passwordOk = await bcrypt.compare(seed.password, existing.passwordHash);
    const nameChanged = existing.displayName !== seed.displayName;
    if (!emailChanged && passwordOk && !nameChanged) continue;

    const passwordHash = passwordOk
      ? existing.passwordHash
      : await bcrypt.hash(seed.password, 10);
    await col.updateOne(
      { _id: existing._id },
      {
        $set: {
          email: seed.email,
          displayName: seed.displayName,
          passwordHash,
        },
      },
    );
  }
}

export async function loginWithPassword(
  email: string,
  password: string,
): Promise<{ token: string; user: AuthUser }> {
  await ensureInviteUsers();
  const col = await users();
  const doc = await col.findOne({ email: email.toLowerCase().trim() });
  if (!doc) {
    throw Object.assign(new Error("Invalid email or password"), {
      statusCode: 401,
    });
  }
  const ok = await bcrypt.compare(password, doc.passwordHash);
  if (!ok) {
    throw Object.assign(new Error("Invalid email or password"), {
      statusCode: 401,
    });
  }

  const id = String(doc._id);
  const token = await new SignJWT({
    role: doc.role,
    email: doc.email,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(id)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(jwtSecret());

  return {
    token,
    user: {
      id,
      role: doc.role,
      email: doc.email,
      displayName: doc.displayName || (doc.role === "arin" ? "Arin Mahi" : "Emon"),
      avatarDataUrl: doc.avatarDataUrl ?? null,
    },
  };
}

export async function requireUser(
  event: APIGatewayProxyEventV2,
): Promise<AuthUser> {
  const token = bearerToken(event);
  if (!token) {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const id = typeof payload.sub === "string" ? payload.sub : null;
    const role = payload.role as UserRole | undefined;
    const email = typeof payload.email === "string" ? payload.email : "";
    if (!id || (role !== "arin" && role !== "emon")) {
      throw new Error("bad token");
    }
    const col = await users();
    const { ObjectId } = await import("./mongo.js");
    const doc = await col.findOne({ _id: new ObjectId(id) });
    return {
      id,
      role,
      email: doc?.email || email,
      displayName:
        doc?.displayName || (role === "arin" ? "Arin Mahi" : "Emon"),
      avatarDataUrl: doc?.avatarDataUrl ?? null,
    };
  } catch {
    throw Object.assign(new Error("Unauthorized"), { statusCode: 401 });
  }
}

export async function requireRole(
  event: APIGatewayProxyEventV2,
  role: UserRole,
): Promise<AuthUser> {
  const user = await requireUser(event);
  if (user.role !== role) {
    throw Object.assign(new Error("Forbidden"), { statusCode: 403 });
  }
  return user;
}
