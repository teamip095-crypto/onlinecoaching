import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";

// POST /api/coaching/pay-platform-fee
// Body: { coachingId, transactionId, amountPaise }
// In production: query payment provider to verify the UPI transaction
// Here: trust the user-submitted transaction ID, then mark coaching as ACTIVE
// In production you'd hit Razorpay/UPI-Collect API to verify.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const body = await req.json();
  const { coachingId, transactionId, amountPaise } = body ?? {};
  if (!coachingId || !transactionId) {
    return NextResponse.json(
      { error: "coachingId and transactionId required" },
      { status: 400 }
    );
  }
  const coaching = await db.coaching.findUnique({ where: { id: coachingId } });
  if (!coaching) {
    return NextResponse.json({ error: "Coaching not found" }, { status: 404 });
  }
  if (coaching.ownerEmail !== session.user.email) {
    return NextResponse.json(
      { error: "Only the coaching owner can verify payment" },
      { status: 403 }
    );
  }
  // In production: verify the UPI transaction via bank API / Razorpay X
  // For now: just mark as active (admin can review later)
  await db.coaching.update({
    where: { id: coachingId },
    data: {
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 86400_000), // 1 year
    },
  });
  await logAccess({
    userId: session.user.id,
    resourceType: "COURSE",
    resourceId: coachingId,
    action: "PLATFORM_FEE_PAID",
    req,
    allowed: true,
    reason: `TXN:${transactionId} amount:${amountPaise ?? 0}paise`,
  });
  await db.notification.create({
    data: {
      userId: session.user.id,
      title: "Platform Fee Paid",
      message: `Thank you! Your coaching "${coaching.name}" is now active. You can start adding faculty, courses, and uploading content.`,
      type: "PAYMENT",
    },
  });
  return NextResponse.json({
    ok: true,
    message: "Coaching activated! Start uploading content.",
  });
}
