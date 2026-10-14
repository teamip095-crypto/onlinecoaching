"use client";

import { useState, useEffect, useRef } from "react";
import { ContentGuard } from "./ContentGuard";
import { Watermark } from "./Watermark";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Lock,
  Maximize2,
  Pause,
  Play,
  Loader2,
  AlertTriangle,
} from "lucide-react";

type Props = {
  lectureId: string;
  title: string;
  faculty: string;
  subject: string;
  isPreview?: boolean;
  onClose: () => void;
  /** Logged-in user info for watermark */
  user: { name: string; identifier: string };
};

type LectureData = {
  id: string;
  title: string;
  videoUrl: string | null;
  duration: number;
  type: string;
  status: string;
};

export function LectureViewer({
  lectureId,
  title,
  faculty,
  subject,
  isPreview = false,
  onClose,
  user,
}: Props) {
  const [lecture, setLecture] = useState<LectureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [paywallInfo, setPaywallInfo] = useState<{
    courseId?: string;
    price?: number;
  } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await fetch(`/api/lectures/${lectureId}`, {
          credentials: "include",
        });
        const data = await r.json();
        if (!active) return;
        if (!r.ok) {
          if (data.code === "NOT_PAID" || data.code === "NOT_ENROLLED") {
            setPaywallInfo({
              courseId: data.courseId,
              price: data.price,
            });
            setError("PAYMENT_REQUIRED");
          } else {
            setError(data.error ?? "Failed to load lecture");
          }
          return;
        }
        setLecture(data.lecture);
        setPaid(true);
      } catch {
        if (active) setError("Network error");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [lectureId]);

  // Auto fullscreen request when video starts playing
  useEffect(() => {
    if (playing && containerRef.current && !isPreview) {
      // Try to enter fullscreen (browser may block; we still request)
      try {
        if (document.fullscreenEnabled && !document.fullscreenElement) {
          containerRef.current.requestFullscreen?.().catch(() => {
            /* user can ignore */
          });
        }
      } catch {
        /* ignore */
      }
    }
  }, [playing, isPreview]);

  // Detect fullscreen exit and auto-pause
  useEffect(() => {
    const onFs = () => {
      const inFs = !!document.fullscreenElement;
      setFullscreen(inFs);
      if (!inFs && videoRef.current && !isPreview) {
        videoRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, [isPreview]);

  // Pause video when tab hidden (anti-screen-record via tab switch)
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && videoRef.current) {
        videoRef.current.pause();
        setPlaying(false);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-slide-up">
      <div
        ref={containerRef}
        className="w-full max-w-5xl bg-black rounded-xl overflow-hidden shadow-2xl"
      >
        {/* Top bar */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-b from-black/80 to-transparent absolute top-0 inset-x-0 z-20">
          <div className="flex items-center gap-2 min-w-0">
            <Lock className="h-4 w-4 text-amber-400 shrink-0" />
            <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px]">
              {isPreview ? "FREE PREVIEW" : "PROTECTED CONTENT"}
            </Badge>
            <span className="text-xs text-white/80 truncate">
              {title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="relative aspect-video bg-black">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-white animate-spin" />
            </div>
          )}

          {error === "PAYMENT_REQUIRED" && paywallInfo && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="h-14 w-14 mx-auto rounded-full bg-amber-500/20 flex items-center justify-center">
                  <Lock className="h-7 w-7 text-amber-400" />
                </div>
                <h3 className="text-white font-bold text-lg mt-3">
                  Payment Required
                </h3>
                <p className="text-white/70 text-sm mt-1">
                  This lecture is part of a paid batch. Complete the
                  enrollment to unlock all lectures, study material and
                  test series.
                </p>
                {paywallInfo.price && (
                  <p className="text-2xl font-bold text-white mt-3">
                    ₹{(paywallInfo.price / 100).toLocaleString()}
                  </p>
                )}
                <div className="flex items-center gap-2 justify-center mt-4">
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                    onClick={onClose}
                  >
                    Pay & Unlock
                  </Button>
                  <Button
                    variant="outline"
                    className="text-white border-white/30 hover:bg-white/10 hover:text-white"
                    onClick={onClose}
                  >
                    Maybe later
                  </Button>
                </div>
              </div>
            </div>
          )}

          {error && error !== "PAYMENT_REQUIRED" && (
            <div className="absolute inset-0 flex items-center justify-center p-6">
              <div className="text-center max-w-md">
                <div className="h-14 w-14 mx-auto rounded-full bg-rose-500/20 flex items-center justify-center">
                  <AlertTriangle className="h-7 w-7 text-rose-400" />
                </div>
                <h3 className="text-white font-bold text-lg mt-3">
                  Cannot load lecture
                </h3>
                <p className="text-white/70 text-sm mt-1">{error}</p>
                <Button
                  variant="outline"
                  className="text-white border-white/30 hover:bg-white/10 hover:text-white mt-3"
                  onClick={onClose}
                >
                  Close
                </Button>
              </div>
            </div>
          )}

          {lecture?.videoUrl && !error && (
            <ContentGuard>
              <Watermark
                name={user.name}
                identifier={user.identifier}
                density="high"
                opacity={0.22}
                fixed={false}
              >
                <video
                  ref={videoRef}
                  src={lecture.videoUrl}
                  className="w-full h-full object-contain"
                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                  disablePictureInPicture
                  disableRemotePlayback
                  onPlay={() => setPlaying(true)}
                  onPause={() => setPlaying(false)}
                  onEnded={() => setPlaying(false)}
                  controls={!isPreview ? false : true}
                />
                {!isPreview && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
                    <Button
                      onClick={togglePlay}
                      size="sm"
                      className="bg-white text-black hover:bg-white/90 hover:text-black"
                    >
                      {playing ? (
                        <>
                          <Pause className="h-4 w-4 mr-1.5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1.5 fill-black" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </Watermark>
            </ContentGuard>
          )}

          {paid && !lecture?.videoUrl && !error && (
            <div className="absolute inset-0 flex items-center justify-center text-white/70 text-sm">
              No video available for this lecture yet.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between absolute bottom-0 inset-x-0 z-20">
          <div className="text-white/60 text-[10px]">
            <p>
              🔒 {isPreview ? "Free preview" : "Encrypted stream"} •
              Watermarked • Download disabled
            </p>
            {!isPreview && !fullscreen && (
              <p className="text-amber-400/80">
                Press Esc to exit fullscreen will pause the video
              </p>
            )}
          </div>
          <div className="text-white/40 text-[10px] text-right">
            <p>{subject} • {faculty}</p>
            <p className="font-mono">{user.identifier}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
