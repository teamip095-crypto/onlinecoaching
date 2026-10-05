"use client";

import { Course, subjectColors, thumbnailColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  PlayCircle,
  Users,
  Star,
  Clock,
  ChevronRight,
  BookOpen,
} from "lucide-react";

type Props = {
  courses: Course[];
  onOpenCourse?: (course: Course) => void;
};

export function CoursesView({ courses, onOpenCourse }: Props) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            You are enrolled in {courses.length} batches • Keep learning!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="rounded-full">
            {courses.filter((c) => c.nextClass === "Today").length} classes today
          </Badge>
        </div>
      </div>

      {/* Course grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => {
          const subjectStyle = subjectColors[course.subject] ?? subjectColors.Science;
          const thumbClass = thumbnailColors[course.thumbnail] ?? "from-violet-500 to-violet-700";

          return (
            <Card
              key={course.id}
              className="overflow-hidden p-0 hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => onOpenCourse?.(course)}
            >
              {/* Thumbnail */}
              <div
                className={`relative h-32 bg-gradient-to-br ${thumbClass} flex items-center justify-center`}
              >
                <BookOpen className="h-12 w-12 text-white/90" />
                {course.badge && (
                  <Badge className="absolute top-3 left-3 bg-white/90 text-foreground hover:bg-white/90 text-[10px] font-bold tracking-wider">
                    {course.badge}
                  </Badge>
                )}
                {course.nextClass === "Today" && (
                  <Badge className="absolute top-3 right-3 bg-rose-500 hover:bg-rose-500 text-white text-[10px] font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse-soft mr-1" />
                    Class Today
                  </Badge>
                )}
              </div>

              {/* Body */}
              <div className="p-4 space-y-3">
                <div>
                  <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px] mb-1.5`}>
                    {course.subject}
                  </Badge>
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                </div>

                {/* Faculty */}
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-bold">
                      {course.facultyAvatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-xs">
                    <p className="font-medium leading-tight">{course.faculty}</p>
                    <p className="text-muted-foreground">Faculty</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-semibold">{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-1.5" />
                  <p className="text-[10px] text-muted-foreground">
                    {course.completedLessons} of {course.totalLessons} lessons completed
                  </p>
                </div>

                {/* Footer meta */}
                <div className="flex items-center justify-between pt-1 border-t border-border text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="font-medium text-foreground">{course.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{course.students.toLocaleString()}</span>
                  </div>
                  {course.nextClassTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{course.nextClassTime}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Explore more */}
      <Card className="p-6 bg-coaching-gradient-soft border-primary/20">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-base">Looking for more batches?</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Browse all available batches, crash courses and foundation programs.
            </p>
          </div>
          <Button className="bg-coaching-gradient text-white hover:opacity-90">
            Explore Batches
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
