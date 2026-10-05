"use client";

import { LiveClass, subjectColors, thumbnailColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Radio, Users, Clock, Calendar, Video, Play, Bell } from "lucide-react";

type Props = {
  classes: LiveClass[];
  onJoin?: (cls: LiveClass) => void;
};

export function LiveClassesView({ classes, onJoin }: Props) {
  const liveNow = classes.filter((c) => c.status === "live");
  const upcoming = classes.filter((c) => c.status === "upcoming" && c.date === "Today");
  const tomorrow = classes.filter((c) => c.status === "upcoming" && c.date === "Tomorrow");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Classes</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Join your scheduled live classes & never miss a session.
        </p>
      </div>

      {/* Live now banner */}
      {liveNow.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Radio className="h-4 w-4 animate-pulse-soft" />
            <h2 className="font-semibold text-sm uppercase tracking-wider">Live Now</h2>
          </div>
          {liveNow.map((cls) => (
            <LiveClassCard key={cls.id} cls={cls} onJoin={onJoin} variant="hero" />
          ))}
        </div>
      )}

      {/* Today's upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h2 className="font-semibold text-sm uppercase tracking-wider">Today's Upcoming</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {upcoming.map((cls) => (
              <LiveClassCard key={cls.id} cls={cls} onJoin={onJoin} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Tomorrow */}
      {tomorrow.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">Tomorrow</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {tomorrow.map((cls) => (
              <LiveClassCard key={cls.id} cls={cls} variant="compact" />
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {liveNow.length === 0 && upcoming.length === 0 && tomorrow.length === 0 && (
        <Card className="p-12 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Video className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mt-3">No Live Classes Scheduled</h3>
          <p className="text-sm text-muted-foreground mt-1">
            You have no live classes scheduled right now. Check back later or explore recorded lectures.
          </p>
        </Card>
      )}
    </div>
  );
}

function LiveClassCard({
  cls,
  onJoin,
  variant = "compact",
}: {
  cls: LiveClass;
  onJoin?: (cls: LiveClass) => void;
  variant?: "hero" | "compact";
}) {
  const subjectStyle = subjectColors[cls.subject] ?? subjectColors.Science;
  const thumbClass = thumbnailColors[cls.thumbnail] ?? "from-violet-500 to-violet-700";
  const isLive = cls.status === "live";

  if (variant === "hero") {
    return (
      <Card className="overflow-hidden p-0 border-primary/30">
        <div className={`relative h-44 bg-gradient-to-br ${thumbClass} flex items-center justify-center`}>
          <div className="absolute inset-0 bg-black/30" />
          {isLive && (
            <Badge className="absolute top-3 left-3 bg-rose-500 hover:bg-rose-500 text-white text-[10px] font-bold">
              <Radio className="h-2.5 w-2.5 mr-1 animate-pulse-soft" />
              LIVE NOW
            </Badge>
          )}
          <Badge className="absolute top-3 right-3 bg-black/40 hover:bg-black/40 text-white text-[10px]">
            <Users className="h-2.5 w-2.5 mr-1" />
            {cls.attendees.toLocaleString()} watching
          </Badge>
          <Button
            size="lg"
            className="relative bg-white text-primary hover:bg-white/90 hover:text-primary rounded-full h-12 w-12 p-0"
            onClick={() => onJoin?.(cls)}
          >
            <Play className="h-5 w-5 fill-primary" />
          </Button>
        </div>
        <div className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px] mb-1.5`}>
                {cls.subject}
              </Badge>
              <h3 className="font-semibold text-base leading-tight">{cls.title}</h3>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-semibold tabular-nums">{cls.startTime}</p>
              <p className="text-[10px] text-muted-foreground">to {cls.endTime}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                {cls.faculty.split(" ").map(w => w[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-xs font-medium leading-tight">{cls.faculty}</p>
              <p className="text-[10px] text-muted-foreground">Faculty</p>
            </div>
            <Button size="sm" className="bg-coaching-gradient text-white" onClick={() => onJoin?.(cls)}>
              <Video className="h-3.5 w-3.5 mr-1" />
              Join Now
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden p-0 hover:shadow-md transition-shadow">
      <div className={`relative h-20 bg-gradient-to-br ${thumbClass} flex items-center px-4`}>
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative flex items-center justify-between w-full">
          <div className="flex items-center gap-3 text-white">
            <Clock className="h-4 w-4" />
            <div>
              <p className="text-sm font-bold tabular-nums leading-tight">{cls.startTime}</p>
              <p className="text-[10px] opacity-90">to {cls.endTime}</p>
            </div>
          </div>
          <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px]`}>
            {cls.subject}
          </Badge>
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold leading-snug line-clamp-2">{cls.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">by {cls.faculty}</p>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Bell className="h-3 w-3" />
            <span>Set reminder</span>
          </div>
          {isLive ? (
            <Button size="sm" className="bg-rose-500 hover:bg-rose-500 text-white h-7 text-xs">
              Join Now
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-7 text-xs">
              Notify Me
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
