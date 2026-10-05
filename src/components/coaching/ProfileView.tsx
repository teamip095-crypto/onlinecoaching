"use client";

import { userProfile } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Flame,
  Trophy,
  HelpCircle,
  CheckCircle2,
  Calendar,
  CreditCard,
  GraduationCap,
  Award,
  TrendingUp,
  Settings,
  Bell,
  BookOpen,
  Pencil,
  ChevronRight,
} from "lucide-react";

type Props = {
  onNavigate?: (section: "courses" | "live" | "study" | "tests" | "doubts") => void;
};

export function ProfileView({ onNavigate }: Props) {
  const fee = userProfile.feeStatus;
  const paidPct = Math.round((fee.paid / fee.total) * 100);

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="overflow-hidden p-0 border-0">
        {/* Banner */}
        <div className="relative h-28 bg-coaching-gradient">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute right-4 top-4">
            <Button size="sm" variant="secondary" className="bg-white/15 text-white hover:bg-white/25 hover:text-white border-0 h-8">
              <Settings className="h-3.5 w-3.5 mr-1" />
              Settings
            </Button>
          </div>
        </div>
        {/* Profile body */}
        <div className="px-5 pb-5 -mt-10">
          <div className="flex items-end gap-4 flex-wrap">
            <Avatar className="h-20 w-20 border-4 border-background">
              <AvatarFallback className="bg-primary text-primary-foreground text-xl font-bold h-full">
                {userProfile.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pt-10">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold">{userProfile.name}</h1>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 text-[10px]">
                  <GraduationCap className="h-2.5 w-2.5 mr-1" />
                  {userProfile.rollNo}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">{userProfile.batch}</p>
              <p className="text-xs text-muted-foreground">{userProfile.className}</p>
            </div>
            <Button size="sm" variant="outline" className="h-8">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile
          icon={<TrendingUp className="h-4 w-4" />}
          label="Attendance"
          value={`${userProfile.attendance}%`}
          color="emerald"
        />
        <StatTile
          icon={<Trophy className="h-4 w-4" />}
          label="Avg Score"
          value={`${userProfile.avgScore}%`}
          color="amber"
        />
        <StatTile
          icon={<Award className="h-4 w-4" />}
          label="Batch Rank"
          value={`#${userProfile.rank}`}
          color="violet"
        />
        <StatTile
          icon={<Flame className="h-4 w-4" />}
          label="Streak"
          value={`${userProfile.streak}d`}
          color="rose"
        />
      </div>

      {/* Achievements */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-base">Achievements</h2>
          <Badge variant="secondary" className="text-[10px]">{userProfile.achievements.length} badges</Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {userProfile.achievements.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center text-center p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors cursor-pointer"
            >
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/40 dark:to-amber-900/40 flex items-center justify-center text-2xl">
                {a.icon}
              </div>
              <p className="text-xs font-semibold mt-2 leading-tight">{a.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{a.date}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Activity summary */}
      <Card className="p-5">
        <h2 className="font-semibold text-base mb-4">Learning Activity</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <ActivityTile
            icon={<BookOpen className="h-4 w-4" />}
            value={userProfile.testsAttempted}
            label="Tests Attempted"
            onClick={() => onNavigate?.("tests")}
          />
          <ActivityTile
            icon={<HelpCircle className="h-4 w-4" />}
            value={userProfile.doubtsAsked}
            label="Doubts Asked"
            onClick={() => onNavigate?.("doubts")}
          />
          <ActivityTile
            icon={<CheckCircle2 className="h-4 w-4" />}
            value={userProfile.doubtsAnswered}
            label="Doubts Solved"
            onClick={() => onNavigate?.("doubts")}
          />
        </div>
      </Card>

      {/* Fee status */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-base flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" />
              Fee Status
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Next installment due on {fee.dueDate}
            </p>
          </div>
          <Button size="sm" className="bg-coaching-gradient text-white">
            Pay ₹{fee.pending.toLocaleString()}
          </Button>
        </div>

        {/* Fee progress */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Total Paid</span>
            <span className="font-semibold">
              ₹{fee.paid.toLocaleString()} of ₹{fee.total.toLocaleString()}
            </span>
          </div>
          <Progress value={paidPct} className="h-2" />
          <p className="text-[10px] text-muted-foreground">
            {paidPct}% paid • ₹{fee.pending.toLocaleString()} pending
          </p>
        </div>

        {/* Installments */}
        <div className="space-y-2">
          {fee.installments.map((inst) => (
            <div
              key={inst.id}
              className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/40 transition-colors"
            >
              <div
                className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                  inst.status === "paid"
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300"
                    : "bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-300"
                }`}
              >
                {inst.status === "paid" ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{inst.label}</p>
                <p className="text-[11px] text-muted-foreground">Due: {inst.date}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums">₹{inst.amount.toLocaleString()}</p>
                <Badge
                  className={
                    inst.status === "paid"
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 text-[9px]"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 hover:bg-amber-100 text-[9px]"
                  }
                >
                  {inst.status === "paid" ? "PAID" : "DUE"}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Quick links */}
      <Card className="p-2">
        <QuickLink icon={<Bell className="h-4 w-4" />} label="Notifications" sub="5 new" />
        <QuickLink icon={<Settings className="h-4 w-4" />} label="App Settings" sub="Theme, language" />
        <QuickLink icon={<HelpCircle className="h-4 w-4" />} label="Help & Support" sub="FAQ, contact us" />
      </Card>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "emerald" | "amber" | "violet" | "rose";
}) {
  const colors = {
    emerald: "text-emerald-600 dark:text-emerald-400",
    amber: "text-amber-600 dark:text-amber-400",
    violet: "text-violet-600 dark:text-violet-400",
    rose: "text-rose-600 dark:text-rose-400",
  };
  return (
    <Card className="p-4">
      <div className={`flex items-center gap-2 ${colors[color]}`}>
        {icon}
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-2 tabular-nums">{value}</p>
    </Card>
  );
}

function ActivityTile({
  icon,
  value,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  value: number;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="text-left p-3 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-[10px] uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-2xl font-bold mt-1.5 tabular-nums">{value}</p>
    </button>
  );
}

function QuickLink({ icon, label, sub }: { icon: React.ReactNode; label: string; sub: string }) {
  return (
    <button className="w-full flex items-center gap-3 p-3 rounded-md hover:bg-muted/40 transition-colors text-left">
      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </button>
  );
}

