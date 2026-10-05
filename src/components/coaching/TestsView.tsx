"use client";

import { TestSeries, subjectColors } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Trophy,
  HelpCircle,
  Target,
  CheckCircle2,
  AlertCircle,
  Timer,
  ChevronRight,
  Award,
  Users,
} from "lucide-react";

type Props = {
  tests: TestSeries[];
};

const difficultyStyle: Record<TestSeries["difficulty"], string> = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
};

export function TestsView({ tests }: Props) {
  const attempted = tests.filter((t) => t.status === "attempted");
  const available = tests.filter((t) => t.status === "available" || t.status === "in-progress");
  const expired = tests.filter((t) => t.status === "expired");

  const avgScore =
    attempted.length > 0
      ? Math.round(
          (attempted.reduce((s, t) => s + (t.score ?? 0), 0) /
            attempted.reduce((s, t) => s + t.marks, 0)) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Test Series</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Attempt tests, track progress & improve your rank.
          </p>
        </div>
      </div>

      {/* Performance summary */}
      <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Trophy className="h-4 w-4" />
            <span className="text-xs font-medium">Attempted</span>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">{attempted.length}</p>
          <p className="text-[10px] text-muted-foreground">tests so far</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <Target className="h-4 w-4" />
            <span className="text-xs font-medium">Avg Score</span>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">{avgScore}%</p>
          <p className="text-[10px] text-muted-foreground">across all tests</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Award className="h-4 w-4" />
            <span className="text-xs font-medium">Best Rank</span>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">#78</p>
          <p className="text-[10px] text-muted-foreground">Genetics Test</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-4 w-4" />
            <span className="text-xs font-medium">Available</span>
          </div>
          <p className="text-2xl font-bold mt-2 tabular-nums">{available.length}</p>
          <p className="text-[10px] text-muted-foreground">pending tests</p>
        </Card>
      </div>

      {/* Available tests */}
      {available.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-primary flex items-center gap-2">
            <Timer className="h-4 w-4" />
            Available Now
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {available.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        </div>
      )}

      {/* Attempted tests */}
      {attempted.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            Attempted Tests
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {attempted.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        </div>
      )}

      {/* Expired tests */}
      {expired.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Expired
          </h2>
          <div className="grid gap-3 md:grid-cols-2">
            {expired.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TestCard({ test }: { test: TestSeries }) {
  const subjectStyle = subjectColors[test.subject] ?? subjectColors.Science;
  const scorePct =
    test.score !== undefined && test.marks > 0
      ? Math.round((test.score / test.marks) * 100)
      : 0;
  const isExpired = test.status === "expired";
  const isAttempted = test.status === "attempted";

  return (
    <Card className={`p-4 ${isExpired ? "opacity-60" : ""}`}>
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px]`}>
              {test.subject}
            </Badge>
            <Badge className={`${difficultyStyle[test.difficulty]} hover:${difficultyStyle[test.difficulty]} text-[10px]`}>
              {test.difficulty}
            </Badge>
            {test.status === "in-progress" && (
              <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">
                In Progress
              </Badge>
            )}
          </div>
          <h3 className="font-semibold text-sm leading-snug">{test.title}</h3>
        </div>
      </div>

      {/* Test meta */}
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-lg bg-muted/60 p-2">
          <HelpCircle className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold mt-1 tabular-nums">{test.totalQuestions}</p>
          <p className="text-[9px] text-muted-foreground">Questions</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <Clock className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold mt-1 tabular-nums">{test.duration}m</p>
          <p className="text-[9px] text-muted-foreground">Duration</p>
        </div>
        <div className="rounded-lg bg-muted/60 p-2">
          <Target className="h-3.5 w-3.5 mx-auto text-muted-foreground" />
          <p className="text-sm font-bold mt-1 tabular-nums">{test.marks}</p>
          <p className="text-[9px] text-muted-foreground">Max Marks</p>
        </div>
      </div>

      {/* Result for attempted tests */}
      {isAttempted && test.score !== undefined && (
        <div className="space-y-2 mb-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Your Score</span>
            <span className="text-base font-bold text-primary tabular-nums">
              {test.score}/{test.marks}
            </span>
          </div>
          <Progress value={scorePct} className="h-1.5" />
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              Rank #{test.rank} of {test.totalAttempts?.toLocaleString()}
            </span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{scorePct}%</span>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div className="text-[10px] text-muted-foreground">
          <p className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {test.startDate} → {test.endDate}
          </p>
          {test.totalAttempts && (
            <p className="flex items-center gap-1 mt-0.5">
              <Users className="h-3 w-3" />
              {test.totalAttempts.toLocaleString()} attempts
            </p>
          )}
        </div>
        {isExpired ? (
          <Button size="sm" variant="ghost" className="h-7 text-xs" disabled>
            Expired
          </Button>
        ) : isAttempted ? (
          <Button size="sm" variant="outline" className="h-7 text-xs">
            View Solutions
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        ) : (
          <Button size="sm" className="bg-coaching-gradient text-white h-7 text-xs">
            {test.status === "in-progress" ? "Resume" : "Start Test"}
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </div>
    </Card>
  );
}
