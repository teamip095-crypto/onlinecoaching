import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";
import crypto from "crypto";

// POST /api/payments/create-order
// Body: { courseId: string }
//
// UPI QR-based payment (no Razorpay/gateway SDK needed):
// 1. Server creates Payment record with status=CREATED
// 2. Returns UPI deep link for QR code (pa=9301056006@upi&am=AMOUNT)
// 3. Student scans QR with any UPI app (GPay/PhonePe/Paytm/BHIM)
// 4. Student pays externally, gets UTR (transaction ID)
// 5. Student submits UTR to /api/payments/verify
// 6. Server verifies signature + activates enrollment

const PLATFORM_UPI_NUMBER = "9301056006";
const PLATFORM_UPI_ID = `${PLATFORM_UPI_NUMBER}@upi`;
const PLATFORM_PAYEE_NAME = "OnlineCoaching";

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
  // Generate a unique order ID for this payment (no external API call)
  const providerOrderId = `order_upi_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
  const payment = await db.payment.create({
    data: {
      userId: session.user.id,
      courseId,
      amount: course.price,
      status: "CREATED",
      provider: "UPI_QR",
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
  // Build UPI deep link for QR code
  // upi://pay?pa=UPI_ID&pn=PAYEE_NAME&am=AMOUNT&cu=INR&tn=NOTE&tr=RECEIPT
  const amountRupees = (course.price / 100).toFixed(2);
  const note = `Course: ${course.title.slice(0, 30)}`;
  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(PLATFORM_UPI_ID)}&pn=${encodeURIComponent(PLATFORM_PAYEE_NAME)}&am=${amountRupees}&cu=INR&tn=${encodeURIComponent(note)}&tr=${encodeURIComponent(receipt)}`;
  return NextResponse.json({
    paymentId: payment.id,
    providerOrderId,
    amount: course.price,
    amountRupees: course.price / 100,
    currency: "INR",
    receipt,
    courseTitle: course.title,
    // UPI QR payment details (no gateway SDK)
    upiId: PLATFORM_UPI_ID,
    upiNumber: PLATFORM_UPI_NUMBER,
    payeeName: PLATFORM_PAYEE_NAME,
    upiDeepLink, // encode this in a QR code
    notes: "Scan the QR with any UPI app (GPay/PhonePe/Paytm/BHIM) to pay. After payment, enter the UTR.",
  });
}
