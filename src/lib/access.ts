import { db } from "./db";

export const ACCESS_DENIED_REASONS = {
  NOT_ENROLLED: "NOT_ENROLLED",
  NOT_PAID: "NOT_PAID",
  ENROLLMENT_INACTIVE: "ENROLLMENT_INACTIVE",
  ENROLLMENT_EXPIRED: "ENROLLMENT_EXPIRED",
} as const;

export type AccessResult =
  | { allowed: true; enrollmentId: string; coursePrice?: number }
  | { allowed: false; reason: string; coursePrice?: number };

// Core security gate: must have ACTIVE enrollment AND paid payment
export async function hasAccessToCourse(
  userId: string,
  courseId: string
): Promise<AccessResult> {
  const enrollment = await db.enrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (!enrollment) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });
    return { allowed: false, reason: ACCESS_DENIED_REASONS.NOT_ENROLLED, coursePrice: course?.price };
  }
  if (enrollment.status !== "ACTIVE") {
    return { allowed: false, reason: ACCESS_DENIED_REASONS.ENROLLMENT_INACTIVE };
  }
  if (enrollment.expiresAt && enrollment.expiresAt < new Date()) {
    return { allowed: false, reason: ACCESS_DENIED_REASONS.ENROLLMENT_EXPIRED };
  }
  // Hard payment check
  const paidPayment = await db.payment.findFirst({
    where: { userId, courseId, status: "PAID" },
    select: { id: true },
  });
  if (!paidPayment) {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { price: true },
    });
    return { allowed: false, reason: ACCESS_DENIED_REASONS.NOT_PAID, coursePrice: course?.price };
  }
  return { allowed: true, enrollmentId: enrollment.id };
}

export async function logAccess(args: {
  userId?: string;
  resourceType: string;
  resourceId: string;
  action: string;
  req: Request;
  allowed: boolean;
  reason?: string;
}) {
  const ip = args.req.headers.get("x-forwarded-for") ?? "unknown";
  const ua = args.req.headers.get("user-agent") ?? "unknown";
  try {
    await db.accessLog.create({
      data: {
        userId: args.userId ?? null,
        resourceType: args.resourceType,
        resourceId: args.resourceId,
        action: args.action,
        ipAddress: ip,
        userAgent: ua,
        allowed: args.allowed,
        reason: args.reason ?? null,
      },
    });
  } catch {
    // logging is best-effort
  }
}

// Generate a short-lived signed token for content access
// (In production this would be a JWT signed with a server secret;
// here we use a simple HMAC-like token for demo purposes)
export function createSignedContentToken(payload: {
  userId: string;
  resourceId: string;
  type: string;
  ttlSec?: number;
}): { token: string; expiresAt: number } {
  const ttl = payload.ttlSec ?? 300; // 5 min default
  const expiresAt = Date.now() + ttl * 1000;
  const data = `${payload.userId}|${payload.resourceId}|${payload.type}|${expiresAt}`;
  // Simple base64 + HMAC (use proper JWT in production)
  const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
  const token = Buffer.from(
    `${data}.${simpleHmac(data, secret)}`
  ).toString("base64url");
  return { token, expiresAt };
}

export function verifySignedContentToken(
  token: string
): { userId: string; resourceId: string; type: string; expiresAt: number } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [data, sig] = decoded.split(".");
    if (!data || !sig) return null;
    const [userId, resourceId, type, expiresAtStr] = data.split("|");
    const expiresAt = Number(expiresAtStr);
    if (!userId || !resourceId || !type || !expiresAt) return null;
    if (Date.now() > expiresAt) return null;
    const secret = process.env.NEXTAUTH_SECRET ?? "dev-secret";
    const expectedSig = simpleHmac(data, secret);
    if (sig !== expectedSig) return null;
    return { userId, resourceId, type, expiresAt };
  } catch {
    return null;
  }
}

// Tiny string-hash (NOT crypto-secure; use Node's crypto in production)
function simpleHmac(data: string, secret: string): string {
  // Use node crypto via dynamic require to keep this isomorphic
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("crypto");
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex")
    .slice(0, 16);
}
