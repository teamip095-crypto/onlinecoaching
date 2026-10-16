import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

// GET /api/admin/stats - platform owner dashboard stats (SUPER_ADMIN only)
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Please login" }, { status: 401 });
  }
  const role = (session.user as { role?: string }).role;
  if (role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Super admin only" }, { status: 403 });
  }
  const [
    totalUsers,
    totalFaculty,
    totalCoachings,
    activeCoachings,
    totalCourses,
    totalStudents,
    totalPayments,
    paidPayments,
    totalRevenue,
    totalUploads,
    storageUsed,
    totalAccessLogs,
    deniedAccess,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: { in: ["FACULTY", "COACHING_OWNER"] } } }),
    db.coaching.count(),
    db.coaching.count({ where: { isActive: true } }),
    db.course.count(),
    db.user.count({ where: { role: "STUDENT" } }),
    db.payment.count(),
    db.payment.count({ where: { status: "PAID" } }),
    db.payment.aggregate({ where: { status: "PAID" }, _sum: { amount: true } }),
    db.uploadedFile.count(),
    db.uploadedFile.aggregate({ _sum: { size: true } }),
    db.accessLog.count(),
    db.accessLog.count({ where: { allowed: false } }),
  ]);
  return NextResponse.json({
    users: {
      total: totalUsers,
      faculty: totalFaculty,
      students: totalStudents,
    },
    coachings: {
      total: totalCoachings,
      active: activeCoachings,
    },
    courses: totalCourses,
    payments: {
      total: totalPayments,
      paid: paidPayments,
      revenuePaise: totalRevenue._sum.amount ?? 0,
      revenueRupees: ((totalRevenue._sum.amount ?? 0) / 100).toFixed(2),
    },
    storage: {
      fileCount: totalUploads,
      bytesUsed: storageUsed._sum.size ?? 0,
      mbUsed: ((storageUsed._sum.size ?? 0) / 1024 / 1024).toFixed(2),
    },
    security: {
      accessLogsTotal: totalAccessLogs,
      accessDenied: deniedAccess,
      denialRate: totalAccessLogs ? ((deniedAccess / totalAccessLogs) * 100).toFixed(1) + "%" : "0%",
    },
    timestamp: new Date().toISOString(),
  });
}
