import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";

// GET /api/doubts - list all doubts (only for logged-in users)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }
  const doubts = await db.doubt.findMany({
    include: {
      answers: {
        include: {
          user: {
            select: { name: true, role: true, avatarText: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  await logAccess({
    userId: session.user.id,
    resourceType: "DOUBT",
    resourceId: "list",
    action: "VIEW",
    req,
    allowed: true,
  });
  return NextResponse.json({ doubts });
}

// POST /api/doubts - ask a new doubt
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login first" }, { status: 401 });
  }
  const body = await req.json();
  const { question, subject, attachments } = body ?? {};
  if (!question || question.trim().length < 10) {
    return NextResponse.json(
      { error: "Question must be at least 10 characters" },
      { status: 400 }
    );
  }
  if (!subject) {
    return NextResponse.json({ error: "Subject required" }, { status: 400 });
  }
  const doubt = await db.doubt.create({
    data: {
      userId: session.user.id,
      subject,
      question: question.trim(),
      attachments: attachments ? JSON.stringify(attachments) : null,
      status: "PENDING",
    },
  });
  // Notify all faculty (in production, filter by subject)
  const faculty = await db.user.findMany({
    where: { role: "FACULTY" },
    select: { id: true },
  });
  for (const f of faculty) {
    await db.notification.create({
      data: {
        userId: f.id,
        title: "New Doubt Asked",
        message: `New doubt in ${subject}. Check doubt solving section.`,
        type: "DOUBT",
      },
    });
  }
  return NextResponse.json({ ok: true, doubt });
}
