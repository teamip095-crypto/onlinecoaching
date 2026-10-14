import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "./db";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_DURATION_MIN = 15;

// In-memory brute-force protection (use Redis in production)
const loginAttempts = new Map<string, { count: number; lockedUntil: number }>();

export function checkRateLimit(key: string): { ok: boolean; retryAfter?: number } {
  const now = Date.now();
  const rec = loginAttempts.get(key);
  if (rec && rec.lockedUntil > now) {
    return { ok: false, retryAfter: Math.ceil((rec.lockedUntil - now) / 1000) };
  }
  return { ok: true };
}

export function recordFailedLogin(key: string) {
  const now = Date.now();
  const rec = loginAttempts.get(key) ?? { count: 0, lockedUntil: 0 };
  rec.count += 1;
  if (rec.count >= MAX_LOGIN_ATTEMPTS) {
    rec.lockedUntil = now + LOCK_DURATION_MIN * 60 * 1000;
    rec.count = 0;
  }
  loginAttempts.set(key, rec);
}

export function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt", maxAge: 24 * 60 * 60 }, // 1 day
  jwt: { maxAge: 24 * 60 * 60 },
  pages: {
    signIn: "/",
    error: "/",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        const rate = checkRateLimit(email);
        if (!rate.ok) {
          throw new Error(
            `Too many attempts. Try again in ${rate.retryAfter}s`
          );
        }
        const user = await db.user.findUnique({
          where: { email },
        });
        if (!user) {
          recordFailedLogin(email);
          return null;
        }
        if (user.isBlocked) {
          throw new Error("Account blocked. Contact admin.");
        }
        const ok = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!ok) {
          recordFailedLogin(email);
          return null;
        }
        clearLoginAttempts(email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          rollNo: user.rollNo ?? "",
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? "STUDENT";
        token.rollNo = (user as { rollNo?: string }).rollNo ?? "";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
        (session.user as { rollNo?: string }).rollNo = token.rollNo as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET ?? "dev-only-secret-change-in-production-please",
};
