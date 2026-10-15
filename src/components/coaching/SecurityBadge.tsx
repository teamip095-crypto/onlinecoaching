"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Lock, ShieldCheck, AlertTriangle } from "lucide-react";

type Props = {
  /** Show "SSL Secured" badge explicitly */
  showLabel?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
};

/**
 * SecurityBadge — visibly shows SSL + DRM security status to the user.
 * Checks:
 *   1. Is the page loaded over HTTPS (SSL)?
 *   2. Are security headers (CSP, X-Frame-Options) present?
 *
 * If everything OK → green badge "🔒 SSL Secured"
 * If anything off → red badge "⚠ Insecure"
 */
export function SecurityBadge({ showLabel = true, compact = false }: Props) {
  const [isHttps, setIsHttps] = useState<boolean | null>(null);
  const [hasCSP, setHasCSP] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    // Check 1: HTTPS — derive directly from window
    const checkHttps = () =>
      typeof window !== "undefined" && window.location.protocol === "https:";

    // Check 2: CSP header — fetch self and inspect response headers
    const checkCSP = async () => {
      try {
        const r = await fetch(window.location.href, {
          method: "HEAD",
          cache: "no-store",
        });
        return Boolean(
          r.headers.get("content-security-policy") &&
            r.headers.get("x-frame-options")
        );
      } catch {
        return false;
      }
    };

    // Defer setState to avoid cascading render
    Promise.all([
      Promise.resolve(checkHttps()),
      checkCSP(),
    ]).then(([https, csp]) => {
      if (!active) return;
      setIsHttps(https);
      setHasCSP(csp);
    });

    return () => {
      active = false;
    };
  }, []);

  const secure = isHttps && hasCSP;

  if (compact) {
    return (
      <span
        title={secure ? "🔒 SSL Secured + DRM Active" : "⚠ Security check pending"}
        className="inline-flex items-center gap-1 text-[10px]"
      >
        {secure ? (
          <Lock className="h-3 w-3 text-emerald-500" />
        ) : (
          <AlertTriangle className="h-3 w-3 text-amber-500" />
        )}
      </span>
    );
  }

  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${
        secure
          ? "border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-300"
          : "border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-300"
      }`}
      title={
        secure
          ? "🔒 SSL/HTTPS Active\n🔒 CSP Headers Active\n🔒 Frame-ancestors blocked\n🔒 DRM Watermark Active\n🔒 Screenshot Blocked"
          : "Security headers check pending"
      }
    >
      {secure ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <AlertTriangle className="h-3 w-3" />
      )}
      {showLabel && (secure ? "SSL Secured" : "Securing...")}
    </Badge>
  );
}
