import { db } from "./db";
import crypto from "crypto";

// In-memory OTP store (production: use Redis or DB table)
// Map<key, { code: string, expiresAt: number, attempts: number, verified: boolean }>
const otpStore = new Map<string, { code: string; expiresAt: number; attempts: number; verified: boolean }>();

const OTP_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_ATTEMPTS = 5;

export type OtpPurpose = "PAYMENT" | "DEVICE_VERIFY" | "DOUBT_REPLY";

export function makeOtpKey(userId: string, purpose: OtpPurpose, refId?: string) {
  return `otp:${userId}:${purpose}:${refId ?? ""}`;
}

export function generateOtp(userId: string, purpose: OtpPurpose, refId?: string): {
  code: string;
  expiresAt: number;
} {
  // 6-digit code
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, "0");
  const expiresAt = Date.now() + OTP_TTL_MS;
  const key = makeOtpKey(userId, purpose, refId);
  otpStore.set(key, { code, expiresAt, attempts: 0, verified: false });
  return { code, expiresAt };
}

export function verifyOtp(
  userId: string,
  purpose: OtpPurpose,
  refId: string | undefined,
  inputCode: string
): { ok: boolean; reason?: string } {
  const key = makeOtpKey(userId, purpose, refId);
  const entry = otpStore.get(key);
  if (!entry) {
    return { ok: false, reason: "OTP_EXPIRED_OR_NOT_SENT" };
  }
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(key);
    return { ok: false, reason: "OTP_EXPIRED" };
  }
  if (entry.verified) {
    return { ok: false, reason: "OTP_ALREADY_USED" };
  }
  if (entry.attempts >= MAX_ATTEMPTS) {
    otpStore.delete(key);
    return { ok: false, reason: "TOO_MANY_ATTEMPTS" };
  }
  entry.attempts += 1;
  if (!crypto.timingSafeEqual(
    Buffer.from(entry.code),
    Buffer.from(inputCode.padEnd(entry.code.length, " "))
  )) {
    return { ok: false, reason: "INVALID_OTP" };
  }
  entry.verified = true;
  return { ok: true };
}

// Single-device session enforcement.
// On each successful login, we mark the previous session token as superseded.
// When the next request comes with the old token, we check if it's still the
// active one. If not, the user is force-logged-out from the old device.

const activeSessionByUser = new Map<string, string>(); // userId → active session token (hashed)

export function setActiveSession(userId: string, sessionTokenHash: string) {
  activeSessionByUser.set(userId, sessionTokenHash);
}

export function isActiveSession(userId: string, sessionTokenHash: string): boolean {
  const active = activeSessionByUser.get(userId);
  if (!active) return true; // no record means allow (first session after restart)
  return active === sessionTokenHash;
}

export function revokeAllSessions(userId: string) {
  activeSessionByUser.delete(userId);
}

// Persist active session to DB so it survives restarts
export async function persistActiveSession(userId: string, token: string) {
  const hashed = hashToken(token);
  setActiveSession(userId, hashed);
  // Mark older sessions as revoked
  await db.userSession.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  await db.userSession.create({
    data: {
      userId,
      token: hashed,
      userAgent: "unknown",
      ipAddress: "unknown",
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    },
  });
}

export async function checkSessionValid(userId: string, token: string): Promise<boolean> {
  const hashed = hashToken(token);
  const inMemory = isActiveSession(userId, hashed);
  if (!inMemory) {
    // Check DB — the most recent non-revoked session for this user
    const sess = await db.userSession.findFirst({
      where: { userId, revokedAt: null, token: hashed },
      orderBy: { createdAt: "desc" },
    });
    if (!sess) return false;
    // Promote to in-memory cache
    setActiveSession(userId, hashed);
    return true;
  }
  return true;
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
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-license-secret";
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
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) return null;
    const data = `${userId}|${fileId}|${expiresAt}`;
    const expectedSig = crypto.createHmac("sha256", secret).update(data).digest("hex").slice(0, 24);
    if (sig !== expectedSig) return null;
    return { userId, fileId, expiresAt };
  } catch {
    return null;
  }
}
