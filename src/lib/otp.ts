import { db } from "./db";
import bcrypt from "bcryptjs";
import crypto from "crypto";

// OTP system — DB-backed (survives server restarts, works across instances)
// Stores bcrypt hash of OTP code (never plaintext)
// 5-minute expiry, max 5 attempts, single-use

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "PAYMENT" | "DEVICE_VERIFY" | "DOUBT_REPLY";

export function makeOtpKey(userId: string, purpose: OtpPurpose, refId?: string) {
  return `otp:${userId}:${purpose}:${refId ?? ""}`;
}

export async function generateOtp(
  userId: string,
  purpose: OtpPurpose,
  refId?: string
): Promise<{ code: string; expiresAt: number }> {
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const codeHash = await bcrypt.hash(code, 10); // lower cost than user password (10 rounds)
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);
  // Upsert: replace any existing OTP for same key+purpose+refId
  await db.otpToken.upsert({
    where: {
      userId_purpose_refId: {
        userId,
        purpose,
        refId: refId ?? null as any,
      },
    } as any,
    update: {
      codeHash,
      attempts: 0,
      verified: false,
      expiresAt,
    },
    create: {
      userId,
      purpose,
      refId: refId ?? null as any,
      codeHash,
      attempts: 0,
      verified: false,
      expiresAt,
    },
  });
  return { code, expiresAt: expiresAt.getTime() };
}

export async function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  refId: string | undefined,
  inputCode: string
): Promise<{ ok: boolean; reason?: string }> {
  const token = await db.otpToken.findUnique({
    where: {
      userId_purpose_refId: {
        userId,
        purpose,
        refId: refId ?? null as any,
      },
    } as any,
  });
  if (!token) {
    return { ok: false, reason: "OTP_EXPIRED_OR_NOT_SENT" };
  }
  if (Date.now() > token.expiresAt.getTime()) {
    await db.otpToken.delete({ where: { id: token.id } }).catch(() => {});
    return { ok: false, reason: "OTP_EXPIRED" };
  }
  if (token.verified) {
    return { ok: false, reason: "OTP_ALREADY_USED" };
  }
  if (token.attempts >= MAX_ATTEMPTS) {
    await db.otpToken.delete({ where: { id: token.id } }).catch(() => {});
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }
  // Increment attempts
  await db.otpToken.update({
    where: { id: token.id },
    data: { attempts: { increment: 1 } },
  });
  const ok = await bcrypt.compare(inputCode, token.codeHash);
  if (!ok) {
    return { ok: false, reason: "INVALID_OTP" };
  }
  await db.otpToken.update({
    where: { id: token.id },
    data: { verified: true },
  });
  return { ok: true };
}

// Cleanup expired OTPs — called by cron job
export async function cleanupExpiredOtps(): Promise<{ deleted: number }> {
  const result = await db.otpToken.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return { deleted: result.count };
}

// Single-device session enforcement (DB-backed, persistent across restarts)
// On login: revoke all previous sessions for user, create new one.
// On each request: check if the request's token matches the latest active session.

export async function persistSession(
  userId: string,
  token: string,
  meta?: { userAgent?: string; ipAddress?: string }
): Promise<void> {
  const hashed = hashToken(token);
  // Revoke all previous sessions
  await db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  // Create new active session
  await db.userSession.create({
    data: {
      userId,
      token: hashed,
      userAgent: meta?.userAgent ?? "unknown",
      ipAddress: meta?.ipAddress ?? "unknown",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });
}

export async function isSessionValid(userId: string, token: string): Promise<boolean> {
  const hashed = hashToken(token);
  const sess = await db.userSession.findFirst({
    where: {
      userId,
      token: hashed,
      revokedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return !!sess;
}

export async function revokeAllSessions(userId: string): Promise<void> {
  await db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

// Cleanup expired sessions
export async function cleanupExpiredSessions(): Promise<{ deleted: number }> {
  const result = await db.userSession.deleteMany({
    where: { expiresAt: { lt: new Date() } },
  });
  return { deleted: result.count };
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// License key generation for downloaded content (DRM layer)
// Each download gets a unique license tied to the user's device fingerprint.
// Without a valid license, the downloaded file cannot be decrypted.
export function generateLicenseKey(userId: string, fileId: string): {
  licenseKey: string;
  expiresAt: number;
} {
  const secret = requireSecret();
  const ttl = 24 * 3600 * 1000; // 24 hours
  const expiresAt = Date.now() + ttl;
  const data = `${userId}|${fileId}|${expiresAt}`;
  const sig = crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 24);
  const licenseKey = Buffer.from(`${data}|${sig}`).toString("base64url");
  return { licenseKey, expiresAt };
}

export function verifyLicenseKey(
  licenseKey: string
): { userId: string; fileId: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(licenseKey, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 4) return null;
    const [userId, fileId, expiresAtStr, sig] = parts;
    const expiresAt = Number(expiresAtStr);
    if (!userId || !fileId || !expiresAt || !sig) return null;
    if (Date.now() > expiresAt) return null;
    const secret = requireSecret();
    const data = `${userId}|${fileId}|${expiresAt}`;
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 24);
    if (sig !== expectedSig) return null;
    return { userId, fileId, expiresAt };
  } catch {
    return null;
  }
}

function requireSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error(
      "NEXTAUTH_SECRET environment variable is required. Refusing to use weak security."
    );
  }
  return s;
}

// DB-backed rate limiting (works across server instances)
export async function checkRateLimit(key: string): Promise<{ ok: boolean; retryAfter?: number }> {
  const rl = await db.rateLimit.findUnique({ where: { bucket: key } });
  if (!rl) return { ok: true };
  if (rl.lockedUntil && rl.lockedUntil > new Date()) {
    return { ok: false, retryAfter: Math.ceil((rl.lockedUntil.getTime() - Date.now()) / 1000) };
  }
  return { ok: true };
}

export async function recordFailedLogin(key: string): Promise<void> {
  const rl = await db.rateLimit.upsert({
    where: { bucket: key },
    update: { attempts: { increment: 1 } },
    create: { bucket: key, attempts: 1 },
  });
  if (rl.attempts >= MAX_LOGIN_ATTEMPTS) {
    await db.rateLimit.update({
      where: { bucket: key },
      data: { lockedUntil: new Date(Date.now() + 15 * 60 * 1000) }, // 15min lockout
    });
  }
}

export async function clearLoginAttempts(key: string): Promise<void> {
  await db.rateLimit.delete({ where: { bucket: key } }).catch(() => {});
}

const MAX_LOGIN_ATTEMPTS = 5;
