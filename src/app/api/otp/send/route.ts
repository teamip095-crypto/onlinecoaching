import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { generateOtp, type OtpPurpose } from "@/lib/otp";
import { sendOtpWhatsapp } from "@/lib/whatsapp";

// POST /api/otp/send
// Body: { purpose: "PAYMENT" | "DEVICE_VERIFY", refId?: string }
// Sends OTP to the user's phone (via WhatsApp if env configured, else just returns ok)
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
  // Rate limit: max 1 OTP per 30s per user+purpose
  // (production: use Redis)
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { phone: true, name: true, email: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const { code, expiresAt } = generateOtp(session.user.id, purpose, refId);
  // Try to send via WhatsApp
  const sent = await sendOtpWhatsapp(user.phone, code, purpose);
  // In dev, return the OTP for testing (REMOVE in production)
  const isDev = process.env.NODE_ENV !== "production";
  return NextResponse.json({
    ok: true,
    sentViaWhatsapp: sent,
    expiresAt,
    ...(isDev ? { devCode: code } : {}),
    message: sent
      ? "OTP sent to your WhatsApp number"
      : "OTP generated (configure WhatsApp env to actually send)",
  });
}
