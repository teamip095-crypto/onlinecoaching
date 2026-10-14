import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/courses - list all published courses
export async function GET() {
  const session = await getServerSession(authOptions);
  const courses = await db.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      slug: true,
      subject: true,
      facultyName: true,
      facultyAvatar: true,
      totalLessons: true,
      students: true,
      rating: true,
      price: true,
      badge: true,
    },
    orderBy: { createdAt: "desc" },
  });
  // If logged in, attach the user's enrollment status (paid or not)
  let userEnrollments: Record<string, { enrolled: boolean; paid: boolean }> = {};
  if (session?.user?.id) {
    const enrolls = await db.enrollment.findMany({
      where: { userId: session.user.id, status: "ACTIVE" },
      select: { courseId: true, userId: true },
    });
    const pays = await db.payment.findMany({
      where: { userId: session.user.id, status: "PAID" },
      select: { courseId: true },
    });
    for (const c of courses) {
      userEnrollments[c.id] = {
        enrolled: enrolls.some((e) => e.courseId === c.id),
        paid: pays.some((p) => p.courseId === c.id),
      };
    }
  }
  return NextResponse.json({
    courses,
    user: session?.user?.id
      ? { id: session.user.id, name: session.user.name, email: session.user.email }
      : null,
    enrollments: userEnrollments,
  });
}

// POST /api/courses - faculty create a new course
// Body: { title, description, subject, price, badge }
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "FACULTY" && role !== "COACHING_OWNER" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only faculty/owners can create courses" },
      { status: 403 }
    );
  }
  const body = await req.json();
  const { title, description, subject, price, badge } = body ?? {};
  if (!title || !subject) {
    return NextResponse.json({ error: "title, subject required" }, { status: 400 });
  }
  const slug = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const avatarText = (session.user.name ?? "F")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const course = await db.course.create({
    data: {
      title,
      slug,
      description: description ?? "",
      subject,
      facultyId: session.user.id,
      facultyName: session.user.name ?? "Faculty",
      facultyAvatar: avatarText,
      totalLessons: 0,
      students: 0,
      rating: 0,
      price: price ?? 0, // in paise
      badge: badge ?? null,
      isPublished: true,
    },
  });
  return NextResponse.json({ ok: true, course });
}
