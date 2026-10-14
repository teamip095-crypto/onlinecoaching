import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { checkRateLimit, recordFailedLogin } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const ip =
      req.headers.get("x-forwarded-for") ?? "unknown";
    const rate = checkRateLimit(`register:${ip}`);
    if (!rate.ok) {
      return NextResponse.json(
        { error: `Too many attempts. Try again in ${rate.retryAfter}s` },
        { status: 429 }
      );
    }
    const body = await req.json();
    const { email, phone, name, password, rollNo, className, batchName } =
      body ?? {};

    // Server-side validation
    if (
      !email || typeof email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    if (!phone || !/^\d{10}$/.test(String(phone))) {
      return NextResponse.json(
        { error: "Phone must be 10 digits" },
        { status: 400 }
      );
    }
    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: "Name too short" },
        { status: 400 }
      );
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const exists = await db.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { phone }] },
    });
    if (exists) {
      recordFailedLogin(`register:${ip}`);
      return NextResponse.json(
        { error: "Email or phone already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const avatarText = name
      .split(" ")
      .map((w: string) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    // Auto-promote the very first sign-up to SUPER_ADMIN so the platform
    // can be bootstrapped. Subsequent sign-ups default to STUDENT.
    // In production, you can also set SUPER_ADMIN_EMAIL env var to restrict
    // which email becomes admin.
    const userCount = await db.user.count();
    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const role =
      userCount === 0
        ? "SUPER_ADMIN"
        : adminEmail && email.toLowerCase() === adminEmail.toLowerCase()
          ? "SUPER_ADMIN"
          : "STUDENT";

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        phone,
        name,
        passwordHash,
        rollNo: rollNo ?? null,
        className: className ?? null,
        batchName: batchName ?? null,
        avatarText,
        role,
      },
    });

    return NextResponse.json({
      ok: true,
      userId: user.id,
      role: user.role,
      message: "Account created. Please login.",
    });
  } catch (err) {
    console.error("register error:", err);
    return NextResponse.json(
      { error: "Registration failed. Try again." },
      { status: 500 }
    );
  }
}
