import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/lectures?courseId=... - list lectures for a course (only paid users get videoUrl)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const url = new URL(req.url);
  const courseId = url.searchParams.get("courseId");
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }
  const lectures = await db.lecture.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      subject: true,
      facultyName: true,
      type: true,
      status: true,
      duration: true,
      attendees: true,
      isPreview: true,
      startTime: true,
      // videoUrl is excluded; only returned via /api/lectures/[id] after paid check
    },
  });
  return NextResponse.json({ lectures });
}

// POST /api/lectures - create a lecture (live class with external link OR just metadata)
// Body: { courseId, title, description, subject, type, startTime, videoUrl?, isPreview }
// Faculty only
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "FACULTY" && role !== "COACHING_OWNER" && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Faculty only" }, { status: 403 });
  }
  const body = await req.json();
  const { courseId, title, description, subject, type, startTime, videoUrl, isPreview } = body ?? {};
  if (!courseId || !title) {
    return NextResponse.json({ error: "courseId, title required" }, { status: 400 });
  }
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.facultyId !== session.user.id && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not your course" }, { status: 403 });
  }
  const lecture = await db.lecture.create({
    data: {
      courseId,
      title,
      description: description ?? "",
      subject: subject ?? "General",
      facultyName: session.user.name ?? "Faculty",
      type: type ?? "LIVE",
      status: "SCHEDULED",
      startTime: startTime ? new Date(startTime) : new Date(),
      duration: 0,
      videoUrl: videoUrl ?? null, // external link (e.g. Zoom/Meet) - allowed
      isPreview: Boolean(isPreview),
      attendees: 0,
    },
  });
  await db.course.update({
    where: { id: courseId },
    data: { totalLessons: { increment: 1 } },
  });
  return NextResponse.json({ ok: true, lecture });
}
