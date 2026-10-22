import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { generateOtp, checkRateLimit, recordFailedLogin, type OtpPurpose } from "@/lib/otp";
import { sendOtpEmail, isEmailConfigured } from "@/lib/email";

// POST /api/otp/send
// Body: { purpose: "PAYMENT" | "DEVICE_VERIFY" | "DOUBT_REPLY", refId?: string }
// Sends OTP to the user's EMAIL (via Resend, free 3000/month)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const body = await req.json();
  const purpose: OtpPurpose = body?.purpose ?? "PAYMENT";
  const refId: string | undefined = body?.refId;
  if (!["PAYMENT", "DEVICE_VERIFY", "DOUBT_REPLY"].includes(purpose)) {
    return NextResponse.json({ error: "Invalid purpose" }, { status: 400 });
  }
  // Rate limit: max 1 OTP request per 30s per user+purpose
  const rateKey = `otp:${session.user.id}:${purpose}`;
  const rate = await checkRateLimit(rateKey);
  if (!rate.ok) {
    return NextResponse.json(
      { error: `Too many OTP requests. Try again in ${rate.retryAfter}s` },
      { status: 429 }
    );
  }
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (!user.email) {
    return NextResponse.json({ error: "No email on file for OTP" }, { status: 400 });
  }
  const { code, expiresAt } = await generateOtp(session.user.id, purpose, refId);
  // Send OTP via EMAIL
  const sent = await sendOtpEmail(user.email, code, purpose, user.name ?? undefined, session.user.id);
  // In dev mode (no RESEND_API_KEY), return the code for testing
  const isDev = process.env.NODE_ENV !== "production" || !isEmailConfigured();
  return NextResponse.json({
    ok: true,
    sentViaEmail: sent,
    emailConfigured: isEmailConfigured(),
    expiresAt,
    ...(isDev ? { devCode: code } : {}),
    message: sent && isEmailConfigured()
      ? `OTP sent to ${user.email}`
      : "OTP generated. Set RESEND_API_KEY to actually send emails.",
  });
}
