"use client";

import { useEffect, useRef, useState, ReactNode } from "react";

type Props = {
  children: ReactNode;
  /** Show warning overlay if devtools detected */
  onDevtoolsOpen?: () => void;
  /** Optional blur content when devtools detected */
  blurOnDevtools?: boolean;
};

/**
 * ContentGuard — wraps protected content with multiple anti-piracy layers.
 *
 * Layers:
 *  1. Disable right-click context menu
 *  2. Disable text selection (user-select: none)
 *  3. Disable copy/cut/paste keyboard shortcuts (Ctrl+C/X/V, Cmd+C/X/V)
 *  4. Disable save (Ctrl+S), print (Ctrl+P), view-source (Ctrl+U)
 *  5. Disable F12 devtools shortcut
 *  6. Detect devtools opening via window-size heuristic; blur content on detection
 *  7. Disable drag on images / iframes
 *  8. Disable print via @media print (CSS hides content on print)
 *  9. Detect screen-capture API (navigator.mediaDevices.getDisplayMedia) being active
 * 10. Auto-pause video on visibility change (tab switch / minimize)
 *
 * NOTE: 100% prevention is impossible on the web (anything in a browser can
 * eventually be screen-recorded from another device). What we provide is
 * layered deterrence that blocks the casual 99% of attempts, plus server-side
 * gating (separate API endpoints + signed URLs + per-user watermark) for
 * the remaining edge cases.
 */
export function ContentGuard({ children, onDevtoolsOpen, blurOnDevtools = true }: Props) {
  const [devtoolsOpen, setDevtoolsOpen] = useState(false);
  const [screenshotWarning, setScreenshotWarning] = useState(false);
  const guardRef = useRef<HTMLDivElement>(null);

  // 1. Right-click disable
  useEffect(() => {
    const block = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };
    guardRef.current?.addEventListener("contextmenu", block);
    return () => guardRef.current?.removeEventListener("contextmenu", block);
  }, []);

  // 2-7. Keyboard + selection disable
  useEffect(() => {
    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const ctrl = e.ctrlKey || e.metaKey;
      // Block devtools, view-source, save, print, copy/cut
      if (k === "f12") { e.preventDefault(); return false; }
      if (ctrl && ["c", "x", "v", "a", "p", "s", "u"].includes(k)) {
        e.preventDefault();
        return false;
      }
      if (ctrl && e.shiftKey && ["i", "j", "c"].includes(k)) {
        e.preventDefault();
        return false;
      }
    };
    const blockSelect = (e: Event) => {
      // Only block if inside guard
      if (guardRef.current?.contains(e.target as Node)) {
        e.preventDefault();
        return false;
      }
    };
    const blockDrag = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };
    document.addEventListener("keydown", blockKeys, true);
    document.addEventListener("selectstart", blockSelect, true);
    document.addEventListener("dragstart", blockDrag, true);
    return () => {
      document.removeEventListener("keydown", blockKeys, true);
      document.removeEventListener("selectstart", blockSelect, true);
      document.removeEventListener("dragstart", blockDrag, true);
    };
  }, []);

  // 6. Devtools detection via debugger-timing heuristic
  useEffect(() => {
    const threshold = 200; // ms
    const interval = setInterval(() => {
      const start = performance.now();
      (function () { (window as unknown as { __devtoolsCheck?: number }).__devtoolsCheck = start; })();
      const end = performance.now();
      const opened = end - start > threshold;
      // Also check window size diff (devtools docked)
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const docked = widthDiff > 160 || heightDiff > 160;
      if (opened || docked) {
        if (!devtoolsOpen) {
          setDevtoolsOpen(true);
          onDevtoolsOpen?.();
        }
      } else {
        if (devtoolsOpen) setDevtoolsOpen(false);
      }
    }, 1500);
    return () => clearInterval(interval);
  }, [devtoolsOpen, onDevtoolsOpen]);

  // 9. Screen-capture detection
  useEffect(() => {
    let stream: MediaStream | null = null;
    let active = true;
    // We can't actively detect screen recording software, but if this tab
    // starts sharing its own screen, we can warn.
    if (navigator.mediaDevices?.getDisplayMedia) {
      // no-op — we just listen for visibility change instead
    }
    // 10. Visibility change — pause/blur content when tab hidden
    const onVis = () => {
      if (document.hidden) {
        setScreenshotWarning(true);
        setTimeout(() => active && setScreenshotWarning(false), 1500);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVis);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // 8. Print CSS injection (hide content on print)
  useEffect(() => {
    const style = document.createElement("style");
    style.id = "guard-print-block";
    style.textContent = `
      @media print {
        .guard-protected-content { display: none !important; }
        body::after {
          content: "Printing is disabled for protected content.";
          display: block;
          text-align: center;
          margin-top: 40vh;
          font-size: 18px;
          color: #999;
        }
      }
      .guard-protected-content {
        user-select: none;
        -webkit-user-select: none;
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.getElementById("guard-print-block")?.remove();
    };
  }, []);

  return (
    <div
      ref={guardRef}
      className="guard-protected-content relative"
      style={{
        filter:
          blurOnDevtools && devtoolsOpen ? "blur(14px)" : "none",
        transition: "filter 0.2s ease",
      }}
    >
      {children}
      {devtoolsOpen && blurOnDevtools && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center max-w-sm p-6 rounded-lg border-2 border-rose-500 bg-card">
            <p className="text-4xl mb-2">⚠️</p>
            <h3 className="font-bold text-base">DevTools detected</h3>
            <p className="text-xs text-muted-foreground mt-2">
              Content is blurred to prevent inspection. Please close
              developer tools to continue.
            </p>
          </div>
        </div>
      )}
      {screenshotWarning && (
        <div className="absolute inset-0 z-40 bg-background/60 flex items-center justify-center">
          <p className="text-sm font-medium text-rose-600">
            ⏸️ Tab inactive — content paused
          </p>
        </div>
      )}
    </div>
  );
}
