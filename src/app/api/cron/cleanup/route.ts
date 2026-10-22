import { NextResponse } from "next/server";
import { cleanupExpiredOtps, cleanupExpiredSessions } from "@/lib/otp";
import { retryFailedEmails } from "@/lib/email";
import { db } from "@/lib/db";

// GET /api/cron/cleanup - scheduled cleanup of expired OTPs, sessions, rate limits
// Protected by CRON_SECRET env var (set in Vercel cron config)
// Schedule: daily (Hobby plan limit)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const results: Record<string, unknown> = {};
  // 1. Cleanup expired OTPs
  results.expiredOtps = await cleanupExpiredOtps();
  // 2. Cleanup expired sessions
  results.expiredSessions = await cleanupExpiredSessions();
  // 3. Cleanup old rate limit buckets (>1 hour old, unlocked)
  const oldRateLimits = await db.rateLimit.deleteMany({
    where: {
      updatedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) },
      lockedUntil: null,
    },
  });
  results.oldRateLimits = { deleted: oldRateLimits.count };
  // 4. Cleanup old email logs (>30 days)
  const oldEmailLogs = await db.whatsappLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
  });
  results.oldEmailLogs = { deleted: oldEmailLogs.count };
  // 5. Retry failed email sends (best effort)
  results.emailRetries = await retryFailedEmails(20);
  // 6. Cleanup old access logs (>90 days)
  const oldAccessLogs = await db.accessLog.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
  });
  results.oldAccessLogs = { deleted: oldAccessLogs.count };
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    results,
  });
}
