import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { hasAccessToCourse, logAccess } from "@/lib/access";
import { getSupabaseServer, createSignedDownloadUrl } from "@/lib/supabase-server";

export const runtime = "nodejs";

// GET /api/files/[id] - stream/serve uploaded file from Supabase Storage
// Hard security: requires login + paid enrollment (unless file is preview)
//
// Two modes:
//   1. Range request (video streaming): proxy bytes from Supabase with
//      Content-Range support so <video> can seek
//   2. Full request: redirect to short-lived signed URL (5min TTL) OR
//      proxy bytes directly
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
  // OK to serve — log the access
  await logAccess({
    userId: session.user.id,
    resourceType: file.resourceType,
    resourceId: file.resourceId ?? file.id,
    action: "DOWNLOAD",
    req,
    allowed: true,
  });

  // Check if client sent a Range header (video streaming)
  const rangeHeader = req.headers.get("range");

  // For non-range requests (downloads), generate a short-lived signed URL
  // and redirect to it. The signed URL has 5-min TTL — even if forwarded,
  // it expires quickly.
  if (!rangeHeader) {
    const signed = await createSignedDownloadUrl(file.storagePath, 300);
    if (!signed) {
      return NextResponse.json({ error: "Failed to generate download URL" }, { status: 500 });
    }
    return NextResponse.redirect(signed.url, 302, {
      "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    });
  }

  // For range requests (video streaming), proxy bytes from Supabase
  // so the <video> element can seek properly
  try {
    const sb = getSupabaseServer();
    // Parse Range header
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    const startStr = match?.[1] ?? "";
    const endStr = match?.[2] ?? "";
    // Get file info first
    const { data: fileInfo } = await sb.storage
      .from("coaching-uploads")
      .info(file.storagePath);
    const totalSize = (fileInfo as unknown as { metadata?: { size?: number } })?.metadata?.size ?? file.size;
    const start = startStr ? parseInt(startStr, 10) : 0;
    const end = endStr ? parseInt(endStr, 10) : totalSize - 1;
    const chunkSize = end - start + 1;
    // Download the range chunk
    const { data, error } = await sb.storage
      .from("coaching-uploads")
      .download(file.storagePath, {
        transform: { range: { start, end } },
      });
    if (error || !data) {
      // Fallback to signed URL
      const signed = await createSignedDownloadUrl(file.storagePath, 300);
      if (!signed) {
        return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
      }
      return NextResponse.redirect(signed.url, 302);
    }
    const bytes = new Uint8Array(await data.arrayBuffer());
    return new NextResponse(bytes, {
      status: 206, // Partial Content
      headers: {
        "Content-Type": file.mimeType || "application/octet-stream",
        "Content-Length": String(chunkSize),
        "Content-Range": `bytes ${start}-${end}/${totalSize}`,
        "Accept-Ranges": "bytes",
        "Cache-Control": "no-store, no-cache, must-revalidate, private, max-age=0",
        "Content-Disposition": `inline; filename="${file.originalName.replace(/"/g, "'")}"`,
        "X-Content-Type-Options": "nosniff",
        "Cross-Origin-Resource-Policy": "same-origin",
      },
    });
  } catch (err) {
    console.error("Stream error:", err);
    // Fallback to signed URL
    const signed = await createSignedDownloadUrl(file.storagePath, 300);
    if (!signed) {
      return NextResponse.json({ error: "Failed to load file" }, { status: 500 });
    }
    return NextResponse.redirect(signed.url, 302);
  }
}
