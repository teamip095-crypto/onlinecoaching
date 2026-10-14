import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// POST /api/coaching/setup - register a new coaching institute
// Body: { name, tagline, primaryColor, plan }
// Returns: { coachingId, upiId, platformFee, qrData }
// The user becomes COACHING_OWNER role and is linked to the new coaching
const PLATFORM_UPI_NUMBER = "9301056006"; // platform owner's UPI-linked phone
const PLATFORM_UPI_ID = `${PLATFORM_UPI_NUMBER}@upi`;
const PLATFORM_PAYEE_NAME = "OnlineCoaching Platform";

const PLAN_PRICES: Record<string, number> = {
  TRIAL: 0, // 14-day trial
  STARTER: 99900, // Rs 999
  PRO: 299900, // Rs 2999
  ENTERPRISE: 999900, // Rs 9999
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }
  const body = await req.json();
  const { name, tagline, primaryColor, plan } = body ?? {};
  if (!name || name.trim().length < 3) {
    return NextResponse.json(
      { error: "Coaching name too short (min 3 chars)" },
      { status: 400 }
    );
  }
  const planKey = (plan ?? "TRIAL").toUpperCase();
  if (!PLAN_PRICES.hasOwnProperty(planKey)) {
    return NextResponse.json(
      { error: `Invalid plan. Choose: ${Object.keys(PLAN_PRICES).join(", ")}` },
      { status: 400 }
    );
  }
  const slug = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const logoText = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const amountPaise = PLAN_PRICES[planKey];

  const coaching = await db.coaching.create({
    data: {
      name,
      slug,
      tagline: tagline ?? null,
      logoText,
      primaryColor: primaryColor ?? "#6d28d9",
      ownerEmail: session.user.email,
      plan: planKey,
      maxStudents: planKey === "TRIAL" ? 25 : planKey === "STARTER" ? 100 : planKey === "PRO" ? 500 : 5000,
      maxFaculty: planKey === "TRIAL" ? 2 : planKey === "STARTER" ? 5 : planKey === "PRO" ? 20 : 100,
      isActive: planKey === "TRIAL", // paid plans need verification first
      expiresAt: planKey === "TRIAL" ? new Date(Date.now() + 14 * 86400_000) : null,
    },
  });
  // Link user to coaching + promote to COACHING_OWNER
  await db.user.update({
    where: { id: session.user.id },
    data: {
      coachingId: coaching.id,
      role: "COACHING_OWNER",
    },
  });
  // Build UPI deep link for QR
  // upi://pay?pa=UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE
  const upiNote = `Coaching: ${name} (${planKey})`;
  const qrData = amountPaise > 0
    ? `upi://pay?pa=${encodeURIComponent(PLATFORM_UPI_ID)}&pn=${encodeURIComponent(PLATFORM_PAYEE_NAME)}&am=${(amountPaise / 100).toFixed(2)}&cu=INR&tn=${encodeURIComponent(upiNote)}`
    : null;

  return NextResponse.json({
    ok: true,
    coachingId: coaching.id,
    coachingName: coaching.name,
    plan: planKey,
    amountPaise,
    amountRupees: amountPaise / 100,
    upiId: PLATFORM_UPI_ID,
    upiNumber: PLATFORM_UPI_NUMBER,
    payeeName: PLATFORM_PAYEE_NAME,
    qrData,
    note: upiNote,
    isActive: coaching.isActive,
    message: planKey === "TRIAL"
      ? "14-day trial activated! Start uploading your content."
      : "Scan the QR with any UPI app (GPay, PhonePe, Paytm, BHIM) to pay the platform fee. Your coaching will be activated after payment verification.",
  });
}
