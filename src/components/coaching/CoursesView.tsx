"use client";

import { useState, useEffect } from "react";
import { subjectColors, thumbnailColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Users,
  Star,
  Clock,
  ChevronRight,
  BookOpen,
  Loader2,
  Lock,
  PlayCircle,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  subject: string;
  faculty: string;
  facultyAvatar: string;
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
  progress: number;
  students: number;
  rating: number;
  nextClass?: string;
  nextClassTime?: string;
  badge?: string;
  paid: boolean;
  price: number;
};

type Props = {
  onUnlock: (c: { id: string; title: string; price: number }) => void;
  onPlayPreview?: (c: { id: string; title: string; faculty: string; subject: string }) => void;
};

export function CoursesView({ onUnlock, onPlayPreview }: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [enrollments, setEnrollments] = useState<
    Record<string, { enrolled: boolean; paid: boolean }>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/courses", { credentials: "include" });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      const subjectThumb: Record<string, string> = {
        Physics: "physics",
        Chemistry: "chemistry",
        Mathematics: "math",
        Biology: "biology",
        Science: "science",
        "PCM Complete": "physics",
        PCM: "physics",
      };
      const list: Course[] = (data.courses ?? []).map((c: any) => {
        const status = (data.enrollments ?? {})[c.id] ?? {
          enrolled: false,
          paid: false,
        };
        return {
          id: c.id,
          title: c.title,
          subject: c.subject,
          faculty: c.facultyName,
          facultyAvatar: c.facultyAvatar ?? c.facultyName.slice(0, 2).toUpperCase(),
          thumbnail: subjectThumb[c.subject] ?? "science",
          totalLessons: c.totalLessons,
          completedLessons: status.enrolled ? Math.floor(c.totalLessons * 0.3) : 0,
          progress: status.enrolled ? 30 : 0,
          students: c.students,
          rating: c.rating,
          badge: c.badge ?? (status.paid ? "ENROLLED" : "PAY TO UNLOCK"),
          paid: status.paid,
          price: c.price,
        };
      });
      setCourses(list);
      setEnrollments(data.enrollments ?? {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Loading batches...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-rose-600">{error}</p>
        <Button onClick={load} variant="outline" className="mt-2">
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {courses.length} batches available • {courses.filter((c) => c.paid).length} enrolled
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <Card className="p-12 text-center">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="font-semibold mt-3">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            New batches will appear here when faculty creates them.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((c) => {
            const subjectStyle = subjectColors[c.subject] ?? subjectColors.Science;
            const thumbClass = thumbnailColors[c.thumbnail] ?? "from-violet-500 to-violet-700";
            return (
              <Card
                key={c.id}
                className="overflow-hidden p-0 hover:shadow-lg transition-shadow cursor-pointer group"
                onClick={() => {
                  if (c.paid) {
                    onPlayPreview?.({
                      id: c.id,
                      title: c.title,
                      faculty: c.faculty,
                      subject: c.subject,
                    });
                  } else {
                    onUnlock({ id: c.id, title: c.title, price: c.price });
                  }
                }}
              >
                <div
                  className={`relative h-32 bg-gradient-to-br ${thumbClass} flex items-center justify-center`}
                >
                  {c.paid ? (
                    <BookOpen className="h-12 w-12 text-white/90" />
                  ) : (
                    <Lock className="h-12 w-12 text-white/90" />
                  )}
                  {c.badge && (
                    <Badge
                      className={`absolute top-3 left-3 text-[10px] font-bold ${
                        c.paid
                          ? "bg-emerald-500 hover:bg-emerald-500 text-white"
                          : "bg-amber-500 hover:bg-amber-500 text-white"
                      }`}
                    >
                      {c.badge}
                    </Badge>
                  )}
                  {!c.paid && c.price > 0 && (
                    <Badge className="absolute top-3 right-3 bg-white/90 text-foreground hover:bg-white/90 text-[10px]">
                      ₹{(c.price / 100).toLocaleString()}
                    </Badge>
                  )}
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px] mb-1.5`}>
                      {c.subject}
                    </Badge>
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {c.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                        {c.facultyAvatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-xs">
                      <p className="font-medium leading-tight">{c.faculty}</p>
                      <p className="text-muted-foreground">Faculty</p>
                    </div>
                  </div>
                  {c.paid ? (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold">{c.progress}%</span>
                      </div>
                      <Progress value={c.progress} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground">
                        {c.completedLessons} of {c.totalLessons} lessons
                      </p>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full bg-coaching-gradient text-white h-8 text-xs"
                    >
                      <Lock className="h-3 w-3 mr-1.5" />
                      Pay ₹{(c.price / 100).toLocaleString()} to Unlock
                    </Button>
                  )}
                  <div className="flex items-center justify-between pt-1 border-t border-border text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-foreground">
                        {c.rating ? c.rating.toFixed(1) : "New"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span>{c.students.toLocaleString()}</span>
                    </div>
                    {c.paid && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <PlayCircle className="h-3 w-3" />
                        <span>Watch</span>
                      </div>
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
