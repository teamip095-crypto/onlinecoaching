import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";

// POST /api/payments/create-order
// Body: { courseId: string }
// Creates a Payment record with status CREATED and returns a mock provider order
// (In production: integrate Razorpay/Stripe order API)
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
  const providerOrderId = `order_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payment = await db.payment.create({
    data: {
      userId: session.user.id,
      courseId,
      amount: course.price,
      status: "CREATED",
      provider: "RAZORPAY",
      providerOrderId,
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
  // Mock provider response (in production, return razorpay_order_id etc.)
  return NextResponse.json({
    paymentId: payment.id,
    providerOrderId,
    amount: course.price,
    currency: "INR",
    receipt,
    courseTitle: course.title,
    // Demo "key" — in production this would be razorpay_key_id
    keyId: "demo_key",
    notes: "Demo payment gateway (no real money charged)",
  });
}
