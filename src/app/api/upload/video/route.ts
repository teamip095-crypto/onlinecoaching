import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";
import { getSupabaseServer, STORAGE_BUCKET, buildStoragePath } from "@/lib/supabase-server";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 300;

// POST /api/upload/video
// Body: multipart/form-data with:
//   - file: video file (mp4, webm, mov)
//   - courseId: string
//   - title: string
//   - description: string (optional)
//   - subject: string
//   - type: VIDEO | LIVE | RECORDED (default RECORDED)
//   - isPreview: 'true' | 'false' (default false)
// Faculty only.
const MAX_VIDEO = 200 * 1024 * 1024; // 200 MB
const ALLOWED_VIDEO = ["video/mp4", "video/webm", "video/quicktime", "video/x-matroska"];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "FACULTY" && role !== "COACHING_OWNER" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only faculty can upload videos" },
      { status: 403 }
    );
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const courseId = form.get("courseId") as string | null;
  const title = form.get("title") as string | null;
  const description = (form.get("description") as string) ?? "";
  const subject = (form.get("subject") as string) ?? "General";
  const type = (form.get("type") as string) ?? "RECORDED";
  const isPreviewStr = (form.get("isPreview") as string) ?? "false";
  const isPreview = isPreviewStr === "true" || isPreviewStr === "1";

  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (file.size > MAX_VIDEO) {
    return NextResponse.json(
      { error: `File too large. Max ${MAX_VIDEO / 1024 / 1024}MB` },
      { status: 413 }
    );
  }
  if (!ALLOWED_VIDEO.includes(file.type) && !file.name.match(/\.(mp4|webm|mov|mkv)$/i)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use MP4, WebM, MOV, or MKV." },
      { status: 415 }
    );
  }
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.facultyId !== session.user.id && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "You can only upload to your own courses" },
      { status: 403 }
    );
  }

  // Upload to Supabase Storage
  const ext = (file.name.match(/\.([^.]+)$/)?.[1] ?? "mp4").toLowerCase();
  const fileId = crypto.randomBytes(12).toString("hex");
  const storagePath = buildStoragePath(session.user.id, fileId, ext);
  const bytes = await file.arrayBuffer();
  const sb = getSupabaseServer();
  const { error: uploadError } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "video/mp4",
      upsert: false,
    });
  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload to storage" },
      { status: 500 }
    );
  }

  // Create lecture record
  const lecture = await db.lecture.create({
    data: {
      courseId,
      title,
      description,
      subject,
      facultyName: session.user.name ?? "Faculty",
      type,
      status: "COMPLETED",
      duration: 0,
      videoUrl: `/api/files/${fileId}`, // protected route
      isPreview,
      attendees: 0,
    },
  });
  await db.course.update({
    where: { id: courseId },
    data: { totalLessons: { increment: 1 } },
  });
  await db.uploadedFile.create({
    data: {
      fileId,
      uploaderId: session.user.id,
      originalName: file.name,
      mimeType: file.type || "video/mp4",
      size: file.size,
      storagePath,
      resourceType: "LECTURE",
      resourceId: lecture.id,
    },
  });

  await logAccess({
    userId: session.user.id,
    resourceType: "LECTURE",
    resourceId: lecture.id,
    action: "UPLOAD",
    req,
    allowed: true,
  });
  return NextResponse.json({
    ok: true,
    lectureId: lecture.id,
    fileUrl: lecture.videoUrl,
    title: lecture.title,
    storagePath,
    shareableLink: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/?lecture=${lecture.id}`,
  });
}
