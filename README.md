# Online Coaching — SaaS Platform

A full-stack, white-label, multi-tenant SaaS platform for coaching institutes (like ClassPlus/ClassOne). Faculty can upload videos + study material; students pay via UPI to unlock content; per-user watermarking + DRM prevents piracy.

## 🌐 Live Demo

**Production URL:** https://online-coaching-app-gamma.vercel.app

## 🏗️ Tech Stack

- **Framework:** Next.js 16.1.3 (App Router + Turbopack) + TypeScript 5
- **UI:** Tailwind CSS 4 + shadcn/ui (New York)
- **Database:** PostgreSQL (Supabase) — Prisma ORM
- **Storage:** Supabase Storage (private bucket `coaching-uploads`)
- **Auth:** NextAuth v4 (credentials, JWT, AES-256-GCM, 24h sessions)
- **Password Hashing:** bcryptjs (12 rounds)
- **Crypto:** Node.js crypto (HMAC-SHA256 for payment + content signatures)
- **QR Codes:** qrcode (UPI deep links)
- **Hosting:** Vercel (Next.js serverless)

## 🔐 Security Layers (10+)

1. bcrypt password hashing (12 rounds) + brute-force lockout (5 attempts / 15min)
2. NextAuth JWT sessions (AES-256-GCM, 24h expiry)
3. Server-side HMAC-SHA256 payment verification
4. `hasAccessToCourse()` — enrollment+payment check before EVERY file/lecture access
5. AccessLog audit trail (IP, UA, allowed/denied/reason) on all protected routes
6. Signed content URLs (HMAC tokens, 5-min TTL) — Supabase Storage
7. Per-user Watermark (name + rollNo + live timestamp, diagonal grid)
8. ContentGuard client-side protections:
   - Right-click, text-select, copy/cut/paste, drag, print blocked
   - Devtools detection → content blur
   - Iframe buster
   - Canvas tamper detection (toDataURL/toBlob/captureStream blocked)
   - getDisplayMedia (screen-share) blocked
9. LectureViewer DRM: fullscreen lock, no PiP, no remote playback, no download
10. HTTP security headers (CSP, X-Frame-Options: DENY, HSTS 2yr+preload,
    Permissions-Policy, Cross-Origin-* policies)

## 🏢 Multi-Tenant White-Label

- Each coaching institute is a separate `Coaching` tenant with: name, slug,
  tagline, logoText, primaryColor, plan, maxStudents, maxFaculty, isActive
- `User.coachingId` and `Course.coachingId` provide tenant isolation
- Roles: STUDENT, FACULTY, COACHING_OWNER, SUPER_ADMIN
- First signup becomes SUPER_ADMIN automatically

## 💳 Pricing Plans

| Plan | Price | Limits |
|---|---|---|
| TRIAL | Free (14 days) | 25 students, 2 faculty |
| STARTER | ₹999/year | 100 students, 5 faculty |
| PRO | ₹2,999/year | 500 students, 20 faculty |
| ENTERPRISE | ₹9,999/year | 5000 students, 100 faculty |

UPI for platform fee: `9301056006@upi` (works with GPay/PhonePe/Paytm/BHIM)

## 📂 Repository

- **GitHub:** https://github.com/teamip095-crypto/onlinecoaching
- **Supabase Project:** `xobfhmzbcrtiosqwualw` (region: ap-northeast-1)
- **Vercel Project:** `online-coaching-app`

## 🚀 Local Setup

```bash
# 1. Clone
git clone https://github.com/teamip095-crypto/onlinecoaching.git
cd onlinecoaching

# 2. Install
bun install

# 3. Configure env
cp .env.example .env
# Edit .env and fill in NEXTAUTH_SECRET (openssl rand -hex 32),
# DATABASE_URL (your Supabase Postgres connection string),
# SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

# 4. Push DB schema
bun run db:push

# 5. Run dev
bun run dev
```

Visit http://localhost:3000 — first signup becomes SUPER_ADMIN.

## 📦 API Routes

| Route | Method | Auth | Purpose |
|---|---|---|---|
| `/api/auth/register` | POST | Public | Student/faculty registration |
| `/api/auth/[...nextauth]` | GET/POST | Public | NextAuth login/session/logout |
| `/api/courses` | GET | Public | List published courses |
| `/api/courses` | POST | Faculty | Create course |
| `/api/lectures?courseId=` | GET | Logged in | List lectures |
| `/api/lectures` | POST | Faculty | Create lecture (with external link) |
| `/api/lectures/[id]` | GET | Logged in | Get lecture (paid enrollment check) |
| `/api/materials?courseId=` | GET | Logged in | List materials |
| `/api/materials/[id]` | GET | Logged in | Get material (paid check) |
| `/api/upload/video` | POST | Faculty | Upload video (200MB max) → Supabase Storage |
| `/api/upload/material` | POST | Faculty | Upload PDF/DOC (50MB max) → Supabase Storage |
| `/api/files/[id]` | GET | Logged in | Stream file (paid enrollment check, range support) |
| `/api/payments/create-order` | POST | Logged in | Create payment order |
| `/api/payments/verify` | POST | Logged in | Verify payment signature + activate enrollment |
| `/api/notifications` | GET/PATCH | Logged in | List / mark-read notifications |
| `/api/doubts` | GET/POST | Logged in | List / ask doubts |
| `/api/otp/send` | POST | Logged in | Send OTP (via WhatsApp if env configured) |
| `/api/otp/verify` | POST | Logged in | Verify OTP (5-min TTL, 5 attempts) |
| `/api/coaching/setup` | POST | Logged in | Create coaching institute + generate UPI QR |
| `/api/coaching/pay-platform-fee` | POST | Owner | Verify UPI payment + activate coaching |

## ⚠️ Known Limitations

- **Free plan capacity:** 500MB DB, 1GB storage, 50K MAU — upgrade to Pro for more
- **WhatsApp:** sendInvoiceWhatsapp/sendOtpWhatsapp are no-ops until `WHATSAPP_API_URL` + `WHATSAPP_TOKEN` env vars are set
- **Payment verification:** Uses HMAC signature (demo). For real payments, integrate Razorpay SDK in `/api/payments/create-order` and `/verify`
- **Single device session:** In-memory map (resets on server restart) — move to DB for persistence
- **OTP store:** In-memory (5-min TTL). Move to Redis for multi-instance deployments

## 📞 Support

For support: support@onlinecoaching.app

## 📄 License

Proprietary. © 2026 Online Coaching.
