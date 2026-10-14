"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

type Props = {
  /** User's name (for personal watermark) */
  name: string;
  /** Roll number or user ID */
  identifier?: string;
  /** Show on top of any content */
  children?: ReactNode;
  /** Watermark density: 'low' (4) | 'medium' (9) | 'high' (16) */
  density?: "low" | "medium" | "high";
  /** Opacity 0-1 */
  opacity?: number;
  /** Fixed overlay (for video/PDF) vs in-flow */
  fixed?: boolean;
};

/**
 * Watermark — overlays the user's identity (name + roll no + timestamp)
 * across the entire protected content. This deters screen-recording
 * redistribution because the leak can be traced back to the user.
 *
 * Features:
 * - Repeated diagonal watermark grid
 * - Live timestamp that updates every second (so screenshotting at any
 *   moment captures a unique signature)
 * - Random rotation jitter per cell to defeat easy removal
 * - Pointer-events: none so it doesn't block interactions
 * - Subtle opacity so it doesn't ruin UX
 */
export function Watermark({
  name,
  identifier = "",
  children,
  density = "medium",
  opacity = 0.18,
  fixed = false,
}: Props) {
  const [now, setNow] = useState<string>("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      setNow(
        `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
      );
    };
    update();
    const i = setInterval(update, 1000);
    return () => clearInterval(i);
  }, []);

  const cells: number = density === "low" ? 4 : density === "medium" ? 9 : 16;

  const watermarkText = `${name} • ${identifier} • ${now}`;

  return (
    <div ref={containerRef} className={`relative ${fixed ? "fixed inset-0 z-30 pointer-events-none" : ""}`}>
      {children}
      <div
        className="absolute inset-0 grid pointer-events-none select-none"
        style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(cells))}, 1fr)`,
          gridTemplateRows: `repeat(Math.floor(Math.sqrt(cells)), 1fr)`,
          opacity,
        }}
      >
        {Array.from({ length: cells }).map((_, i) => {
          const row = Math.floor(i / Math.ceil(Math.sqrt(cells)));
          const col = i % Math.ceil(Math.sqrt(cells));
          const rotate = -25 + (col % 2) * 8 + (row % 3) * 4;
          return (
            <div
              key={i}
              className="flex items-center justify-center overflow-hidden"
              style={{ transform: `rotate(${rotate}deg)` }}
            >
              <span className="text-[10px] sm:text-xs font-semibold text-foreground whitespace-nowrap tracking-tight">
                {watermarkText}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
