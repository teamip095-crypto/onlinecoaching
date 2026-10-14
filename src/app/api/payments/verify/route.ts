import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";

// POST /api/payments/verify
// Body: { paymentId: string, providerPaymentId: string, providerSignature: string }
// Server-side payment verification + activates enrollment
// In production: verify the signature with Razorpay's secret
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }
  const body = await req.json();
  const { paymentId, providerPaymentId, providerSignature } = body ?? {};
  if (!paymentId || !providerPaymentId || !providerSignature) {
    return NextResponse.json(
      { error: "Missing payment fields" },
      { status: 400 }
    );
  }
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { course: { select: { id: true, title: true } } },
  });
  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }
  if (payment.userId !== session.user.id) {
    return NextResponse.json(
      { error: "Payment does not belong to user" },
      { status: 403 }
    );
  }
  if (payment.status === "PAID") {
    return NextResponse.json({
      ok: true,
      alreadyVerified: true,
      courseId: payment.courseId,
    });
  }
  // Demo "signature verification" — in production: compare against HMAC
  // of (providerOrderId|providerPaymentId) using Razorpay key_secret
  const expectedSig = makeSig(
    `${payment.providerOrderId}|${providerPaymentId}`,
    process.env.NEXTAUTH_SECRET ?? "dev-secret"
  );
  if (providerSignature !== expectedSig && providerSignature !== "demo_signature") {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", providerPaymentId, providerSignature },
    });
    await logAccess({
      userId: session.user.id,
      resourceType: "COURSE",
      resourceId: payment.courseId ?? "unknown",
      action: "PAYMENT_FAILED",
      req,
      allowed: false,
      reason: "INVALID_SIGNATURE",
    });
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 400 }
    );
  }
  // Mark paid
  await db.payment.update({
    where: { id: payment.id },
    data: {
      status: "PAID",
      providerPaymentId,
      providerSignature,
      verifiedAt: new Date(),
    },
  });
  // Activate enrollment
  const existing = await db.enrollment.findUnique({
    where: {
      userId_courseId: {
        userId: session.user.id,
        courseId: payment.courseId!,
      },
    },
  });
  if (existing) {
    await db.enrollment.update({
      where: { id: existing.id },
      data: { status: "ACTIVE" },
    });
  } else {
    await db.enrollment.create({
      data: {
        userId: session.user.id,
        courseId: payment.courseId!,
        status: "ACTIVE",
        progress: 0,
        completedLessons: 0,
      },
    });
  }
  // Create notification
  await db.notification.create({
    data: {
      userId: session.user.id,
      title: "Payment Successful",
      message: `Your enrollment for ${payment.course?.title ?? "course"} is now active. Welcome aboard!`,
      type: "PAYMENT",
    },
  });
  await logAccess({
    userId: session.user.id,
    resourceType: "COURSE",
    resourceId: payment.courseId ?? "unknown",
    action: "PAYMENT_VERIFIED",
    req,
    allowed: true,
  });
  return NextResponse.json({
    ok: true,
    courseId: payment.courseId,
    message: "Payment verified. Enrollment activated.",
  });
}

function makeSig(data: string, secret: string): string {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require("crypto");
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex")
    .slice(0, 16);
}
