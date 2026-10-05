"use client";

import {
  todayClasses,
  dashboardStats,
  recentActivity,
  subjectColors,
} from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  CalendarDays,
  Video,
  FileText,
  HelpCircle,
  TrendingUp,
  ChevronRight,
  Flame,
  Trophy,
  Clock,
  Radio,
} from "lucide-react";

type Props = {
  onNavigate: (section: "courses" | "live" | "study" | "tests" | "doubts") => void;
};

export function DashboardView({ onNavigate }: Props) {
  const totalSubjectHours = dashboardStats.subjectWise.reduce((s, x) => s + x.hours, 0);
  const maxTrend = Math.max(...dashboardStats.weeklyTrend);

  return (
    <div className="space-y-6">
      {/* Greeting Hero */}
      <Card className="relative overflow-hidden p-6 border-0 bg-coaching-gradient text-white">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -right-2 top-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/80 text-xs">
              <Flame className="h-4 w-4" />
              <span className="font-medium">{dashboardStats.streak}-day streak • Keep it going!</span>
            </div>
            <h1 className="text-2xl font-bold leading-tight">
              Good Morning, Aarav! 👋
            </h1>
            <p className="text-sm text-white/85 max-w-md">
              You have <b>{dashboardStats.todayClasses} classes</b>, <b>{dashboardStats.pendingTests} pending tests</b> and <b>{dashboardStats.newMaterial} new study materials</b> today.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Button
                size="sm"
                className="bg-white text-primary hover:bg-white/90 hover:text-primary"
                onClick={() => onNavigate("live")}
              >
                <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse-soft" />
                Join Live Class
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="bg-white/15 text-white hover:bg-white/25 hover:text-white border-0"
                onClick={() => onNavigate("study")}
              >
                Study Material
              </Button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-xs font-medium">Weekly Study Goal</p>
            <p className="text-3xl font-bold tabular-nums">{dashboardStats.weeklyStudy}h</p>
            <p className="text-white/70 text-xs">of {dashboardStats.weeklyGoal}h goal</p>
            <div className="w-32 mt-1.5">
              <Progress
                value={(dashboardStats.weeklyStudy / dashboardStats.weeklyGoal) * 100}
                className="h-1.5 bg-white/20"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Video className="h-5 w-5" />}
          label="Today's Classes"
          value={dashboardStats.todayClasses}
          sub={`${dashboardStats.liveNow} LIVE now`}
          accent="rose"
          onClick={() => onNavigate("live")}
        />
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Study Material"
          value={dashboardStats.newMaterial}
          sub="new uploads"
          accent="emerald"
          onClick={() => onNavigate("study")}
        />
        <StatCard
          icon={<HelpCircle className="h-5 w-5" />}
          label="Pending Tests"
          value={dashboardStats.pendingTests}
          sub="attempt today"
          accent="amber"
          onClick={() => onNavigate("tests")}
        />
        <StatCard
          icon={<Trophy className="h-5 w-5" />}
          label="Your Rank"
          value={`#${dashboardStats.subjectWise.length > 0 ? "142" : ""}`}
          sub="batch leader"
          accent="violet"
          onClick={() => onNavigate("tests")}
        />
      </div>

      {/* Today's timetable */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              Today's Timetable
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              5 classes scheduled • Don't miss any!
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate("live")}>
            View all
            <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
          </Button>
        </div>
        <div className="space-y-2">
          {todayClasses.map((cls) => {
            const style = subjectColors[cls.subject] ?? subjectColors.Science;
            const statusBadge = {
              live: (
                <Badge className="bg-rose-500 hover:bg-rose-500 text-white text-[10px]">
                  <Radio className="h-2.5 w-2.5 mr-1 animate-pulse-soft" />
                  LIVE
                </Badge>
              ),
              upcoming: (
                <Badge variant="outline" className="text-[10px]">Upcoming</Badge>
              ),
              completed: (
                <Badge variant="secondary" className="text-[10px] text-muted-foreground">Completed</Badge>
              ),
            }[cls.status];
            return (
              <div
                key={cls.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                onClick={() => cls.status === "live" && onNavigate("live")}
              >
                <div className="text-xs font-semibold text-muted-foreground w-20 tabular-nums">
                  {cls.time}
                </div>
                <div className={`h-8 w-1 rounded-full ${style.accent}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {cls.topic}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {cls.subject} • {cls.faculty}
                  </p>
                </div>
                {statusBadge}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Two column: Weekly trend + Subject split */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly trend */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Weekly Study Hours
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Total: <b>{dashboardStats.weeklyStudy}h</b> this week
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 h-32">
            {dashboardStats.weeklyTrend.map((val, idx) => {
              const days = ["M", "T", "W", "T", "F", "S", "S"];
              const isToday = idx === 4; // Friday as today
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1">
                  <div className="flex-1 w-full flex items-end">
                    <div
                      className={`w-full rounded-t-md ${
                        isToday ? "bg-primary" : "bg-primary/30"
                      }`}
                      style={{ height: `${(val / maxTrend) * 100}%` }}
                    />
                  </div>
                  <span className={`text-[10px] ${isToday ? "font-bold text-primary" : "text-muted-foreground"}`}>
                    {days[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Subject wise */}
        <Card className="p-5">
          <h2 className="font-semibold text-base mb-1">Subject-wise Hours</h2>
          <p className="text-xs text-muted-foreground mb-4">This week's study distribution</p>
          <div className="space-y-3">
            {dashboardStats.subjectWise.map((s) => {
              const pct = Math.round((s.hours / totalSubjectHours) * 100);
              return (
                <div key={s.subject} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{s.subject}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {s.hours}h • {pct}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className={`h-full ${s.color}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Recent Activity</h2>
        </div>
        <div className="space-y-3">
          {recentActivity.map((a) => (
            <div key={a.id} className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 rounded-full bg-muted flex items-center justify-center text-base">
                {a.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm leading-snug" dangerouslySetInnerHTML={{ __html: a.text }} />
                <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {a.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  accent,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub: string;
  accent: "rose" | "emerald" | "amber" | "violet";
  onClick?: () => void;
}) {
  const accents = {
    rose: "bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300",
    emerald: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300",
    amber: "bg-amber-100 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300",
    violet: "bg-violet-100 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300",
  };
  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${accents[accent]}`}>
          {icon}
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-bold tabular-nums mt-3 leading-none">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
      <p className="text-[10px] text-muted-foreground/80 mt-0.5">{sub}</p>
    </Card>
  );
}
