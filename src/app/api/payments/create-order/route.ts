import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";
import { createOrder, isRazorpayConfigured } from "@/lib/razorpay-server";

// POST /api/payments/create-order
// Body: { courseId: string }
// Creates a Payment record with status CREATED and returns Razorpay order
// If Razorpay env vars are not set, falls back to demo order ID.
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }
  const body = await req.json();
  const { courseId } = body ?? {};
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }
  const course = await db.course.findUnique({
    where: { id: courseId },
    select: { id: true, title: true, price: true, isPublished: true },
  });
  if (!course || !course.isPublished) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  // If already paid, don't allow duplicate payment
  const existingPaid = await db.payment.findFirst({
    where: { userId: session.user.id, courseId, status: "PAID" },
    select: { id: true },
  });
  if (existingPaid) {
    return NextResponse.json({
      error: "Already paid for this course",
      alreadyPaid: true,
    });
  }
  const receipt = `rcpt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  // Create Razorpay order (or demo if not configured)
  const order = await createOrder({
    amountPaise: course.price,
    receipt,
    notes: { courseId, courseTitle: course.title, userId: session.user.id },
  });
  const payment = await db.payment.create({
    data: {
      userId: session.user.id,
      courseId,
      amount: course.price,
      status: "CREATED",
      provider: "RAZORPAY",
      providerOrderId: order.providerOrderId,
      receipt,
      notes: `Enrollment: ${course.title}`,
    },
  });
  await logAccess({
    userId: session.user.id,
    resourceType: "COURSE",
    resourceId: courseId,
    action: "PAYMENT_INITIATED",
    req,
    allowed: true,
  });
  return NextResponse.json({
    paymentId: payment.id,
    providerOrderId: order.providerOrderId,
    amount: order.amountPaise,
    currency: order.currency,
    receipt: order.receipt,
    courseTitle: course.title,
    // Razorpay key ID (only if real Razorpay configured; otherwise demo)
    keyId: process.env.RAZORPAY_KEY_ID ?? "demo_key",
    razorpayConfigured: isRazorpayConfigured(),
    notes: isRazorpayConfigured()
      ? "Razorpay order created — real payment gateway"
      : "Demo payment gateway (set RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET for real payments)",
  });
}
