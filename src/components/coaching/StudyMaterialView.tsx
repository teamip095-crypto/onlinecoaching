"use client";

import { StudyMaterial, subjectColors, thumbnailColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  FileText,
  Video,
  StickyNote,
  FileSpreadsheet,
  Download,
  Play,
  Search,
  Filter,
} from "lucide-react";

type Props = {
  materials: StudyMaterial[];
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

export function StudyMaterialView({ materials }: Props) {
  const [filter, setFilter] = useState<"all" | StudyMaterial["type"]>("all");
  const [query, setQuery] = useState("");

  const filtered = materials.filter((m) => {
    if (filter !== "all" && m.type !== filter) return false;
    if (query && !m.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const subjectList = Array.from(new Set(materials.map((m) => m.subject)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Study Material</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Notes, DPP sheets, video lectures & previous year papers — all in one place.
          </p>
        </div>
      </div>

      {/* Search + filter bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search materials..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {(["all", "pdf", "video", "note", "dpp"] as const).map((t) => {
              const Icon = t === "all" ? Filter : typeMeta[t].icon;
              return (
                <Button
                  key={t}
                  size="sm"
                  variant={filter === t ? "default" : "outline"}
                  className="h-8 rounded-full text-xs whitespace-nowrap"
                  onClick={() => setFilter(t)}
                >
                  <Icon className="h-3 w-3 mr-1" />
                  {t === "all" ? "All" : typeMeta[t].label}
                </Button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* Subject chips */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        <span className="text-xs text-muted-foreground shrink-0 font-medium">Subjects:</span>
        {subjectList.map((s) => {
          const style = subjectColors[s] ?? subjectColors.Science;
          return (
            <Badge key={s} className={`${style.bg} ${style.text} hover:${style.bg} rounded-full whitespace-nowrap`}>
              {s}
            </Badge>
          );
        })}
      </div>

      {/* Materials grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((m) => {
          const meta = typeMeta[m.type];
          const Icon = meta.icon;
          const thumbClass = thumbnailColors[m.thumbnail] ?? "from-violet-500 to-violet-700";

          return (
            <Card key={m.id} className="overflow-hidden p-0 hover:shadow-md transition-shadow">
              <div className={`relative h-24 bg-gradient-to-br ${thumbClass} flex items-center justify-center`}>
                <Icon className="h-8 w-8 text-white/90" />
                {m.isNew && (
                  <Badge className="absolute top-2 right-2 bg-rose-500 hover:bg-rose-500 text-white text-[9px] font-bold">
                    NEW
                  </Badge>
                )}
                {m.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-9 w-9 rounded-full bg-white/90 flex items-center justify-center">
                      <Play className="h-4 w-4 fill-primary text-primary ml-0.5" />
                    </div>
                  </div>
                )}
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${meta.bg} ${meta.text} hover:${meta.bg} text-[9px]`}>
                    <Icon className="h-2.5 w-2.5 mr-1" />
                    {meta.label}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">{m.uploadedAt}</span>
                </div>
                <p className="text-sm font-medium leading-snug line-clamp-2 min-h-[2.5rem]">
                  {m.title}
                </p>
                <div className="flex items-center justify-between pt-1 border-t border-border">
                  <div className="text-[10px] text-muted-foreground">
                    <p className="font-medium text-foreground">{m.faculty}</p>
                    <p>{m.subject}{m.size ? ` • ${m.size}` : m.duration ? ` • ${m.duration}` : ""}</p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                    {m.type === "video" ? (
                      <Play className="h-3.5 w-3.5" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-sm text-muted-foreground">No materials match your search.</p>
        </Card>
      )}
    </div>
  );
}
