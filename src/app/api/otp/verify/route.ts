import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { verifyOtp, type OtpPurpose } from "@/lib/otp";

// POST /api/otp/verify
// Body: { purpose: "PAYMENT" | "DEVICE_VERIFY", refId?: string, code: string }
// Returns ok=true if OTP is correct + marks the resource as verified
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const body = await req.json();
  const purpose: OtpPurpose = body?.purpose ?? "PAYMENT";
  const refId: string | undefined = body?.refId;
  const code: string = body?.code;
  if (!code || !/^\d{6}$/.test(String(code))) {
    return NextResponse.json({ error: "OTP must be 6 digits" }, { status: 400 });
  }
  const r = await verifyOtp(session.user.id, purpose, refId, String(code));
  if (!r.ok) {
    return NextResponse.json(
      { error: "OTP verification failed", code: r.reason },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true, message: "Verified" });
}
