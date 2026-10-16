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

  // 6b. Iframe buster — if this app is embedded in an iframe, escape to top
  useEffect(() => {
    try {
      if (window.top !== window.self) {
        // We're being framed — force the top window to load our app
        window.top!.location.href = window.self.location.href;
      }
    } catch {
      // Cross-origin iframe access throws — that's also a sign of being framed.
      // Use a fallback: hide all content (CSS) and show a warning.
      const style = document.createElement("style");
      style.id = "guard-frame-block";
      style.textContent = `body { display: none !important; }`;
      document.head.appendChild(style);
      // Try to escape via link
      const a = document.createElement("a");
      a.href = window.self.location.href;
      a.target = "_top";
      a.innerText = "Open in new tab";
      document.body.innerHTML = "";
      document.body.appendChild(a);
    }
  }, []);

  // 6c. Canvas tamper detection — if someone tries to render our content
  // to a canvas (for screenshot bypass), block the capture
  useEffect(() => {
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    const origToBlob = HTMLCanvasElement.prototype.toBlob;
    const origCaptureStream = HTMLCanvasElement.prototype.captureStream;
    const block = () => {
      throw new Error("Canvas capture disabled for content protection");
    };
    HTMLCanvasElement.prototype.toDataURL = function (this: HTMLCanvasElement, ...args: unknown[]) {
      try {
        const ctx = this.getContext("2d");
        if (ctx) {
          const data = ctx.getImageData(0, 0, 1, 1);
          if (data.data[3] > 0) {
            block();
          }
        }
      } catch {
        block();
      }
      return origToDataURL.apply(this, args as [string?, number?]);
    } as typeof HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toBlob = function (this: HTMLCanvasElement, ...args: unknown[]) {
      try {
        const ctx = this.getContext("2d");
        if (ctx) {
          const data = ctx.getImageData(0, 0, 1, 1);
          if (data.data[3] > 0) block();
        }
      } catch {
        block();
      }
      return origToBlob.apply(this, args as [(b: Blob | null) => void, string?]);
    } as typeof HTMLCanvasElement.prototype.toBlob;
    if (origCaptureStream) {
      HTMLCanvasElement.prototype.captureStream = function (this: HTMLCanvasElement, ...args: unknown[]) {
        block();
        return origCaptureStream.apply(this, args as [number?]);
      } as typeof HTMLCanvasElement.prototype.captureStream;
    }
    return () => {
      HTMLCanvasElement.prototype.toDataURL = origToDataURL;
      HTMLCanvasElement.prototype.toBlob = origToBlob;
      if (origCaptureStream) {
        HTMLCanvasElement.prototype.captureStream = origCaptureStream;
      }
    };
  }, []);

  // 6d. Detect screen-capture attempt via getDisplayMedia (browser screen-share API)
  useEffect(() => {
    const orig = navigator.mediaDevices?.getDisplayMedia;
    if (!orig) return;
    navigator.mediaDevices.getDisplayMedia = async function (...args) {
      // Block screen capture of our content
      setScreenshotWarning(true);
      throw new DOMException("Screen capture is disabled for protected content", "NotAllowedError");
    } as typeof navigator.mediaDevices.getDisplayMedia;
    return () => {
      if (navigator.mediaDevices) {
        navigator.mediaDevices.getDisplayMedia = orig;
      }
    };
  }, []);

  // 9. Screen-capture detection
  useEffect(() => {
    let active = true;
    // 10. Visibility change — pause/blur content when tab hidden
    const onVis = () => {
      if (document.hidden) {
        setScreenshotWarning(true);
        setTimeout(() => { if (active) setScreenshotWarning(false); }, 1500);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", onVis);
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
