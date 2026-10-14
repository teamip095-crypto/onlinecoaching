import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { hasAccessToCourse, logAccess, ACCESS_DENIED_REASONS } from "@/lib/access";

// GET /api/lectures/[id] - get a single lecture WITH enrollment+payment check
// This is the core security endpoint: no paid enrollment = no lecture
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please login first", code: "AUTH_REQUIRED" },
      { status: 401 }
    );
  }
  const { id } = await params;
  const lecture = await db.lecture.findUnique({
    where: { id },
    include: { course: { select: { id: true, title: true, subject: true } } },
  });
  if (!lecture) {
    return NextResponse.json({ error: "Lecture not found" }, { status: 404 });
  }

  // Preview lectures are free — no enrollment needed
  if (lecture.isPreview) {
    await logAccess({
      userId: session.user.id,
      resourceType: "LECTURE",
      resourceId: lecture.id,
      action: "VIEW",
      req,
      allowed: true,
    });
    return NextResponse.json({
      lecture: {
        id: lecture.id,
        title: lecture.title,
        description: lecture.description,
        subject: lecture.subject,
        facultyName: lecture.facultyName,
        type: lecture.type,
        status: lecture.status,
        duration: lecture.duration,
        attendees: lecture.attendees,
        videoUrl: lecture.videoUrl,
        isPreview: lecture.isPreview,
        courseId: lecture.courseId,
      },
      paid: true,
      isPreview: true,
    });
  }

  // Hard security: must be enrolled + paid to access lectures
  const access = await hasAccessToCourse(session.user.id, lecture.courseId);
  if (!access.allowed) {
    await logAccess({
      userId: session.user.id,
      resourceType: "LECTURE",
      resourceId: lecture.id,
      action: "VIEW",
      req,
      allowed: false,
      reason: access.reason,
    });
    return NextResponse.json(
      {
        error:
          access.reason === ACCESS_DENIED_REASONS.NOT_PAID
            ? "Please purchase this course to access lectures"
            : "Access denied",
        code: access.reason,
        courseId: lecture.courseId,
        price: access.coursePrice,
      },
      { status: 403 }
    );
  }

  await logAccess({
    userId: session.user.id,
    resourceType: "LECTURE",
    resourceId: lecture.id,
    action: "VIEW",
    req,
    allowed: true,
  });

  return NextResponse.json({
    lecture: {
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      subject: lecture.subject,
      facultyName: lecture.facultyName,
      type: lecture.type,
      status: lecture.status,
      duration: lecture.duration,
      attendees: lecture.attendees,
      videoUrl: lecture.videoUrl,
      isPreview: lecture.isPreview,
      courseId: lecture.courseId,
    },
    paid: true,
    isPreview: false,
  });
}
