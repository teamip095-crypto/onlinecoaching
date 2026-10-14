import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/materials?courseId=... - list materials for a course
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
  const mats = await db.studyMaterial.findMany({
    where: { courseId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      type: true,
      subject: true,
      facultyName: true,
      fileSize: true,
      duration: true,
      isPreview: true,
      isNew: true,
      createdAt: true,
      // fileUrl excluded — only via /api/materials/[id] after paid check
    },
  });
  return NextResponse.json({ materials: mats });
}

// POST /api/materials - create material entry with external link (no file upload)
// For uploaded files use /api/upload/material instead
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
  const { courseId, title, subject, type, fileUrl, isPreview } = body ?? {};
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
  const mat = await db.studyMaterial.create({
    data: {
      courseId,
      title,
      type: type ?? "NOTE",
      subject: subject ?? "General",
      facultyName: session.user.name ?? "Faculty",
      fileUrl: fileUrl ?? null, // external link
      isPreview: Boolean(isPreview),
      isNew: true,
    },
  });
  return NextResponse.json({ ok: true, material: mat });
}
