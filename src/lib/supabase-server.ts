import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using service_role key (bypasses RLS)
// Used for: storage uploads, signed URL generation, admin operations
//
// Required env vars:
//   SUPABASE_URL — e.g. https://xobfhmzbcrtiosqwualw.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY — service_role JWT (NEVER expose to client)

let cached: SupabaseClient | null = null;

export function getSupabaseServer(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment. " +
        "Refusing to start without proper storage credentials."
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

export const STORAGE_BUCKET = "coaching-uploads";

// Build the storage path for an uploaded file
// Format: {userId}/{fileId}.{ext}
// This gives per-user isolation in the bucket
export function buildStoragePath(userId: string, fileId: string, ext: string) {
  return `${userId}/${fileId}.${ext}`;
}

// Generate a short-lived signed URL for downloading a protected file
// TTL: 5 minutes (300s) — keeps URLs from being shared/forwarded
export async function createSignedDownloadUrl(
  storagePath: string,
  ttlSec = 300
): Promise<{ url: string; expiresAt: number } | null> {
  const sb = getSupabaseServer();
  const { data, error } = await sb.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, ttlSec, {
      download: true,
    });
  if (error || !data?.signedUrl) {
    console.error("Supabase signed URL error:", error);
    return null;
  }
  return { url: data.signedUrl, expiresAt: Date.now() + ttlSec * 1000 };
}
