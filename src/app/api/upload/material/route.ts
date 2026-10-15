import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { logAccess } from "@/lib/access";
import { getSupabaseServer, STORAGE_BUCKET, buildStoragePath } from "@/lib/supabase-server";
import crypto from "crypto";

export const runtime = "nodejs";
export const maxDuration = 120;

// POST /api/upload/material
// Body: multipart/form-data with file + courseId + title + type + subject + isPreview
const MAX_FILE = 50 * 1024 * 1024; // 50 MB
const ALLOWED = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "image/png",
  "image/jpeg",
  "text/plain",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/zip",
];

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "FACULTY" && role !== "COACHING_OWNER" && role !== "SUPER_ADMIN") {
    return NextResponse.json(
      { error: "Only faculty can upload materials" },
      { status: 403 }
    );
  }
  const form = await req.formData();
  const file = form.get("file") as File | null;
  const courseId = form.get("courseId") as string | null;
  const title = form.get("title") as string | null;
  const subject = (form.get("subject") as string) ?? "General";
  const type = (form.get("type") as string) ?? "PDF"; // PDF | NOTE | DPP
  const isPreviewStr = (form.get("isPreview") as string) ?? "false";
  const isPreview = isPreviewStr === "true" || isPreviewStr === "1";

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });
  if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
  if (file.size > MAX_FILE) {
    return NextResponse.json({ error: `Max ${MAX_FILE / 1024 / 1024}MB` }, { status: 413 });
  }
  if (!ALLOWED.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|png|jpg|jpeg|txt|xlsx|xls|zip)$/i)) {
    return NextResponse.json({ error: "Unsupported file type" }, { status: 415 });
  }
  const course = await db.course.findUnique({ where: { id: courseId } });
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.facultyId !== session.user.id && role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Not your course" }, { status: 403 });
  }

  // Upload to Supabase Storage
  const ext = (file.name.match(/\.([^.]+)$/)?.[1] ?? "pdf").toLowerCase();
  const fileId = crypto.randomBytes(12).toString("hex");
  const storagePath = buildStoragePath(session.user.id, fileId, ext);
  const bytes = await file.arrayBuffer();
  const sb = getSupabaseServer();
  const { error: uploadError } = await sb.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return NextResponse.json(
      { error: "Failed to upload to storage" },
      { status: 500 }
    );
  }

  const mat = await db.studyMaterial.create({
    data: {
      courseId,
      title,
      type,
      subject,
      facultyName: session.user.name ?? "Faculty",
      fileUrl: `/api/files/${fileId}`,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      isPreview,
      isNew: true,
    },
  });
  await db.uploadedFile.create({
    data: {
      fileId,
      uploaderId: session.user.id,
      originalName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
      storagePath,
      resourceType: "MATERIAL",
      resourceId: mat.id,
    },
  });
  await logAccess({
    userId: session.user.id,
    resourceType: "MATERIAL",
    resourceId: mat.id,
    action: "UPLOAD",
    req,
    allowed: true,
  });
  return NextResponse.json({
    ok: true,
    materialId: mat.id,
    fileUrl: mat.fileUrl,
    title: mat.title,
    storagePath,
    shareableLink: `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/?material=${mat.id}`,
  });
}
