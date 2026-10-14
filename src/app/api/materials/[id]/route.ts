import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { hasAccessToCourse, logAccess } from "@/lib/access";

// GET /api/materials/[id]
// Returns a signed short-lived URL only if user is enrolled+paid OR material is preview
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
  const mat = await db.studyMaterial.findUnique({
    where: { id },
    include: { course: { select: { id: true, subject: true, title: true } } },
  });
  if (!mat) {
    return NextResponse.json({ error: "Material not found" }, { status: 404 });
  }
  // Preview materials are free
  if (mat.isPreview) {
    await logAccess({
      userId: session.user.id,
      resourceType: "MATERIAL",
      resourceId: mat.id,
      action: "VIEW",
      req,
      allowed: true,
    });
    return NextResponse.json({
      material: serializeMaterial(mat),
      paid: true,
      isPreview: true,
    });
  }
  // Hard security: paid enrollment required
  const access = await hasAccessToCourse(session.user.id, mat.courseId);
  if (!access.allowed) {
    await logAccess({
      userId: session.user.id,
      resourceType: "MATERIAL",
      resourceId: mat.id,
      action: "VIEW",
      req,
      allowed: false,
      reason: access.reason,
    });
    return NextResponse.json(
      {
        error: "Please purchase this course to download materials",
        code: access.reason,
        courseId: mat.courseId,
        price: access.coursePrice,
      },
      { status: 403 }
    );
  }
  await logAccess({
    userId: session.user.id,
    resourceType: "MATERIAL",
    resourceId: mat.id,
    action: "VIEW",
    req,
    allowed: true,
  });
  return NextResponse.json({
    material: serializeMaterial(mat),
    paid: true,
    isPreview: false,
  });
}

function serializeMaterial(m: {
  id: string;
  title: string;
  type: string;
  subject: string;
  facultyName: string;
  fileUrl: string | null;
  fileSize: string | null;
  duration: string | null;
  isPreview: boolean;
  isNew: boolean;
  createdAt: Date;
  courseId: string;
}) {
  return {
    id: m.id,
    title: m.title,
    type: m.type,
    subject: m.subject,
    facultyName: m.facultyName,
    fileUrl: m.fileUrl,
    fileSize: m.fileSize,
    duration: m.duration,
    isPreview: m.isPreview,
    isNew: m.isNew,
    createdAt: m.createdAt,
    courseId: m.courseId,
  };
}
