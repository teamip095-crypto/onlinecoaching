"use client";

import { StudyMaterial, subjectColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Video,
  StickyNote,
  FileSpreadsheet,
  Download,
  Play,
  Lock,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  // Optional: if courseId passed, show only that course's materials (fetched from API)
  courseId?: string;
  // Fallback: pass materials directly (legacy)
  materials?: StudyMaterial[];
  // User's enrolled+paid course IDs (for showing lock vs unlock)
  paidCourseIds?: Set<string>;
};

const typeMeta: Record<
  StudyMaterial["type"],
  { icon: typeof FileText; label: string; bg: string; text: string }
> = {
  pdf: { icon: FileText, label: "PDF Notes", bg: "bg-rose-100 dark:bg-rose-950/40", text: "text-rose-600 dark:text-rose-300" },
  video: { icon: Video, label: "Video Lecture", bg: "bg-violet-100 dark:bg-violet-950/40", text: "text-violet-600 dark:text-violet-300" },
  note: { icon: StickyNote, label: "Quick Notes", bg: "bg-amber-100 dark:bg-amber-950/40", text: "text-amber-600 dark:text-amber-300" },
  dpp: { icon: FileSpreadsheet, label: "DPP Sheet", bg: "bg-emerald-100 dark:bg-emerald-950/40", text: "text-emerald-600 dark:text-emerald-300" },
};

export function StudyMaterialView({ courseId, materials: staticMats, paidCourseIds }: Props) {
  const [materials, setMaterials] = useState<StudyMaterial[]>(
    staticMats ?? []
  );
  const [loading, setLoading] = useState(!staticMats);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!courseId || staticMats) return;
    (async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/materials?courseId=${courseId}`, {
          credentials: "include",
        });
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "Failed");
        // Map API response to component's expected shape
        const list: StudyMaterial[] = (data.materials ?? []).map((m: any) => ({
          id: m.id,
          title: m.title,
          type: m.type.toLowerCase(),
          subject: m.subject,
          faculty: m.facultyName,
          size: m.fileSize ?? "",
          duration: m.duration ?? undefined,
          uploadedAt: timeAgo(new Date(m.createdAt)),
          isNew: m.isNew,
          isPreview: m.isPreview,
          thumbnail: m.subject.toLowerCase(),
        }));
        setMaterials(list);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, staticMats]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Study Material</h1>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Study Material</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {materials.length} materials • All downloads are watermarked &
          enrollment-protected
        </p>
      </div>

      {materials.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="font-semibold mt-3">No materials yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Faculty uploads will appear here.
          </p>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {materials.map((m) => {
            const meta = typeMeta[m.type] ?? typeMeta.note;
            const Icon = meta.icon;
            const style = subjectColors[m.subject] ?? subjectColors.Science;
            // Determine access: if material has isPreview=false and the user isn't paid → show locked
            const isLocked = !m.isPreview && paidCourseIds && !paidCourseIds.has(m.courseId ?? "");
            return (
              <Card key={m.id} className="overflow-hidden p-0">
                <div className={`relative h-24 ${style.bg} flex items-center justify-center`}>
                  <Icon className={`h-8 w-8 ${style.text}`} />
                  {m.isNew && (
                    <Badge className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-500 text-white text-[9px] font-bold">
                      NEW
                    </Badge>
                  )}
                  {isLocked && (
                    <Badge className="absolute top-2 left-2 bg-amber-500 hover:bg-amber-500 text-white text-[9px] font-bold">
                      <Lock className="h-2 w-2 mr-1" />
                      LOCKED
                    </Badge>
                  )}
                  {m.isPreview && (
                    <Badge className="absolute top-2 left-2 bg-emerald-500 hover:bg-emerald-500 text-white text-[9px] font-bold">
                      FREE
                    </Badge>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <Badge className={`${meta.bg} ${meta.text} hover:${meta.bg} text-[9px]`}>
                    {meta.label}
                  </Badge>
                  <p className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">
                    {m.title}
                  </p>
                  <div className="flex items-center justify-between pt-1 border-t border-border">
                    <div className="text-[10px] text-muted-foreground">
                      <p className="font-medium text-foreground">{m.faculty}</p>
                      <p>{m.subject}{m.size ? ` • ${m.size}` : m.duration ? ` • ${m.duration}` : ""}</p>
                    </div>
                    {isLocked ? (
                      <Button size="sm" variant="ghost" className="h-7 text-xs text-amber-600" disabled>
                        <Lock className="h-3 w-3" />
                      </Button>
                    ) : (
                      <a href={`/api/files/${m.id}`} target="_blank" rel="noreferrer" download={false}>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                          {m.type === "video" ? (
                            <Play className="h-3.5 w-3.5" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(d: Date): string {
  const diff = Date.now() - d.getTime();
  const h = Math.floor(diff / 3600_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h} hours ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  return d.toLocaleDateString();
}
