import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/health - health check endpoint for uptime monitoring
// Checks: database connection, env vars, response time
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { ok: boolean; ms?: number; error?: string }> = {};

  // 1. Database check
  try {
    const t0 = Date.now();
    await db.$queryRaw`SELECT 1`;
    checks.database = { ok: true, ms: Date.now() - t0 };
  } catch (e) {
    checks.database = { ok: false, error: e instanceof Error ? e.message : "DB error" };
  }

  // 2. Env vars check
  const requiredEnvs = ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "DATABASE_URL", "SUPABASE_URL"];
  const missing = requiredEnvs.filter((v) => !process.env[v]);
  checks.env = { ok: missing.length === 0, error: missing.length ? `Missing: ${missing.join(", ")}` : undefined };

  // 3. App version (from package.json)
  checks.app = { ok: true };

  const allOk = Object.values(checks).every((c) => c.ok);
  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      timestamp: new Date().toISOString(),
      uptime_ms: Date.now() - start,
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}
