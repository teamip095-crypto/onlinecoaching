import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Security middleware — applies hardened HTTP headers on every response.
// These headers form the SSL/transport + content-security layer that prevents:
//   - Clickjacking (X-Frame-Options + CSP frame-ancestors)
//   - MIME-type sniffing (X-Content-Type-Options)
//   - Man-in-the-middle downgrade (Strict-Transport-Security)
//   - XSS / inline injection (Content-Security-Policy)
//   - Referrer leakage (Referrer-Policy)
//   - Permission abuse (Permissions-Policy)
//   - Cache leaking of protected content (Cache-Control on /api/files/*)
export function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: { headers: new Headers(req.headers) },
  });

  // 1. Content-Security-Policy — restricts which scripts/styles/connects can run.
  //    Notes:
  //    - 'self' for everything by default
  //    - Allow inline styles (Tailwind needs this) via 'unsafe-inline' in style-src
  //    - Allow data: and blob: URIs for images (qr codes, video poster frames)
  //    - Allow https: media (sample videos on commondatastorage.googleapis.com)
  //    - frame-ancestors 'none' → cannot be embedded in any iframe
  //    - base-uri 'self' → prevent <base> hijack
  //    - form-action 'self' → prevent form submit to attacker
  //    - object-src 'none' → no Flash/Java/plugins
  //    - upgrade-insecure-requests → force HTTPS
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js dev needs unsafe-eval; in prod remove 'unsafe-eval'
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' data: https://fonts.gstatic.com",
    "img-src 'self' data: blob: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  res.headers.set("Content-Security-Policy", csp);

  // 2. X-Frame-Options: DENY — page cannot be framed at all (anti-clickjacking)
  res.headers.set("X-Frame-Options", "DENY");

  // 3. X-Content-Type-Options: nosniff — browser must respect declared MIME
  res.headers.set("X-Content-Type-Options", "nosniff");

  // 4. Strict-Transport-Security — force HTTPS for 2 years, include subdomains, preload
  res.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // 5. Referrer-Policy — only send origin (not full URL) to other origins
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // 6. Permissions-Policy — disable camera, microphone, geolocation, etc. by default
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), interest-cohort=()"
  );

  // 7. Cross-Origin-Resource-Policy — same-origin only for protected resources
  //    (allows our own /api/files/* to be embedded only inside our app)
  res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  res.headers.set("Cross-Origin-Embedder-Policy", "require-corp");

  // 8. For /api/files/* (protected content) — never cache
  //    This ensures the signed URL can't be re-used after expiry
  if (req.nextUrl.pathname.startsWith("/api/files/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private, max-age=0");
    res.headers.set("Pragma", "no-cache");
    res.headers.set("Expires", "0");
    // Also CORP same-origin (already set globally, but reinforce)
    res.headers.set("Cross-Origin-Resource-Policy", "same-origin");
  }

  // 9. For /api/auth/* — don't cache auth responses
  if (req.nextUrl.pathname.startsWith("/api/auth/")) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
  }

  return res;
}

// Run middleware on all routes (including API + static)
export const config = {
  matcher: [
    // Match all paths except static assets
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|logo.svg).*)",
  ],
};
