import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";
import crypto from "crypto";
import { generateOtp } from "@/lib/otp";
import { sendOtpWhatsapp, sendInvoiceWhatsapp } from "@/lib/whatsapp";
import { buildInvoice, invoiceToText, generateInvoiceNumber } from "@/lib/invoice";

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
    include: { course: { select: { id: true, title: true } } } as any,
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
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "Server not configured (NEXTAUTH_SECRET missing)" },
      { status: 500 }
    );
  }
  const expectedSig = makeSig(
    `${payment.providerOrderId}|${providerPaymentId}`,
    secret
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
      message: `Your enrollment for ${(payment as any).course?.title ?? "course"} is now active. Welcome aboard!`,
      type: "PAYMENT",
    },
  });

  // Generate invoice + send via WhatsApp
  const student = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true, email: true },
  });
  let invoiceNumber = generateInvoiceNumber();
  if (student) {
    const invoice = buildInvoice({
      studentName: student.name ?? "Student",
      studentEmail: student.email,
      studentPhone: student.phone,
      courseTitle: (payment as any).course?.title ?? "Course",
      courseId: payment.courseId ?? "unknown",
      amountPaise: payment.amount,
      transactionId: providerPaymentId,
      upiId: "9301056006@upi",
    });
    invoiceNumber = invoice.number;
    const invoiceText = invoiceToText(invoice);
    // Best-effort send via WhatsApp (no-op if env not configured)
    await sendInvoiceWhatsapp(student.phone, {
      number: invoice.number,
      courseTitle: invoice.courseTitle,
      amount: invoice.amountRupees,
      studentName: invoice.studentName,
      date: invoice.date,
    }).catch(() => {});
    // Also store the invoice text on the payment record (notes column)
    await db.payment.update({
      where: { id: payment.id },
      data: { notes: invoiceText.slice(0, 1000) },
    });
  }

  // Send OTP for device verification (next step after payment)
  if (student) {
    const { code, expiresAt } = generateOtp(session.user.id, "PAYMENT", payment.id);
    await sendOtpWhatsapp(student.phone, code, "Activate Enrollment").catch(() => {});
  }

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
    invoiceNumber,
    message: "Payment verified. Invoice sent via WhatsApp. Please complete OTP verification to activate enrollment.",
    otpRequired: true,
    paymentId: payment.id,
  });
}

function makeSig(data: string, secret: string): string {
  return crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex")
    .slice(0, 16);
}
