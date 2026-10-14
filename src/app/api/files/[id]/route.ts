import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { hasAccessToCourse, logAccess } from "@/lib/access";
import { readFile } from "fs/promises";
import path from "path";

export const runtime = "nodejs";

// GET /api/files/[id] - serve uploaded file ONLY if user is logged in + enrolled+paid
// This is the hard security gate: no enrollment+payment = no file bytes
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Please login first" },
      { status: 401 }
    );
  }
  const { id } = await params;
  const file = await db.uploadedFile.findUnique({
    where: { fileId: id },
  });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  // Find the linked lecture or material to check enrollment
  let courseId: string | null = null;
  let isPreview = false;
  if (file.resourceType === "LECTURE") {
    const lecture = await db.lecture.findUnique({
      where: { id: file.resourceId ?? "" },
      select: { courseId: true, isPreview: true },
    });
    if (lecture) {
      courseId = lecture.courseId;
      isPreview = lecture.isPreview;
    }
  } else if (file.resourceType === "MATERIAL") {
    const mat = await db.studyMaterial.findUnique({
      where: { id: file.resourceId ?? "" },
      select: { courseId: true, isPreview: true },
    });
    if (mat) {
      courseId = mat.courseId;
      isPreview = mat.isPreview;
    }
  }
  if (!courseId) {
    return NextResponse.json({ error: "Orphan file" }, { status: 404 });
  }
  // Preview files are free
  if (!isPreview) {
    const access = await hasAccessToCourse(session.user.id, courseId);
    if (!access.allowed) {
      await logAccess({
        userId: session.user.id,
        resourceType: file.resourceType,
        resourceId: file.resourceId ?? file.id,
        action: "DOWNLOAD",
        req,
        allowed: false,
        reason: access.reason,
      });
      return NextResponse.json(
        { error: "Please purchase this course to download files", code: access.reason },
        { status: 403 }
      );
    }
  }
  // OK to serve
  await logAccess({
    userId: session.user.id,
    resourceType: file.resourceType,
    resourceId: file.resourceId ?? file.id,
    action: "DOWNLOAD",
    req,
    allowed: true,
  });
  const absPath = path.join(process.cwd(), "uploads", file.storagePath);
  try {
    const bytes = await readFile(absPath);
    // Force inline display but disable download attribute (browser will still respect Content-Disposition)
    // Set Cache-Control: no-store so the URL doesn't get cached/shared
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(bytes.byteLength),
        "Content-Disposition": `inline; filename="${file.originalName.replace(/"/g, "'")}"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
        "X-Frame-Options": "SAMEORIGIN",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch {
    return NextResponse.json({ error: "File missing on disk" }, { status: 500 });
  }
}
