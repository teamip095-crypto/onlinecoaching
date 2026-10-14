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
