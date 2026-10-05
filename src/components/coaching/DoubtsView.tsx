"use client";

import { Doubt, subjectColors, userProfile } from "@/lib/coaching-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import {
  HelpCircle,
  Paperclip,
  Send,
  ThumbsUp,
  CheckCircle2,
  Clock,
  MessageSquare,
  Filter,
  Search,
  Sparkles,
} from "lucide-react";

type Props = {
  doubts: Doubt[];
};

export function DoubtsView({ doubts }: Props) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "answered" | "pending">("all");
  const [newQuestion, setNewQuestion] = useState("");
  const [showForm, setShowForm] = useState(false);

  const filtered = doubts.filter((d) => {
    if (statusFilter !== "all" && d.status !== statusFilter) return false;
    if (query && !d.question.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const answeredCount = doubts.filter((d) => d.status === "answered").length;
  const pendingCount = doubts.filter((d) => d.status === "pending").length;

  const handleSubmit = () => {
    if (!newQuestion.trim()) return;
    setNewQuestion("");
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doubt Solving</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ask your doubts and get answers from expert faculty within 24 hours.
          </p>
        </div>
        <Button
          className="bg-coaching-gradient text-white"
          onClick={() => setShowForm((s) => !s)}
        >
          <HelpCircle className="h-4 w-4 mr-1.5" />
          Ask a Doubt
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 text-center">
          <p className="text-xl font-bold tabular-nums text-primary">{doubts.length}</p>
          <p className="text-[10px] text-muted-foreground">Total Asked</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
            {answeredCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Answered</p>
        </Card>
        <Card className="p-3 text-center">
          <p className="text-xl font-bold tabular-nums text-amber-600 dark:text-amber-400">
            {pendingCount}
          </p>
          <p className="text-[10px] text-muted-foreground">Pending</p>
        </Card>
      </div>

      {/* Ask doubt form */}
      {showForm && (
        <Card className="p-4 border-primary/30 animate-slide-up">
          <div className="flex items-start gap-3 mb-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                {userProfile.avatar}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-semibold">{userProfile.name}</p>
              <p className="text-[10px] text-muted-foreground">{userProfile.batch}</p>
            </div>
            <Button size="sm" variant="ghost" className="h-7" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
          <Textarea
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your doubt here. Be specific about the question, concept, or step you're stuck on..."
            className="min-h-[120px] resize-none"
          />
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8">
                <Paperclip className="h-3.5 w-3.5 mr-1" />
                Attach
              </Button>
              <select className="h-8 px-3 rounded-md border border-border bg-background text-xs">
                <option>Select Subject</option>
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
              </select>
            </div>
            <Button
              size="sm"
              className="bg-coaching-gradient text-white"
              onClick={handleSubmit}
              disabled={!newQuestion.trim()}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Submit Doubt
            </Button>
          </div>
        </Card>
      )}

      {/* Filter & Search */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search doubts..."
              className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            {(["all", "answered", "pending"] as const).map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                className="h-8 rounded-full text-xs capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Doubts list */}
      <div className="space-y-3">
        {filtered.map((d) => (
          <DoubtCard key={d.id} doubt={d} />
        ))}
      </div>

      {filtered.length === 0 && (
        <Card className="p-12 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <MessageSquare className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mt-3">No doubts found</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Try adjusting your filters, or ask a new doubt.
          </p>
        </Card>
      )}

      {/* AI hint card */}
      <Card className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-950/30 dark:to-fuchsia-950/30 border-violet-200 dark:border-violet-900">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-violet-100 dark:bg-violet-900 flex items-center justify-center shrink-0">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-300" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">AI Doubt Assistant</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get instant hints & similar solved examples while you wait for the faculty answer.
            </p>
            <Button size="sm" variant="outline" className="mt-2 h-7 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Try AI Assistant
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function DoubtCard({ doubt }: { doubt: Doubt }) {
  const subjectStyle = subjectColors[doubt.subject] ?? subjectColors.Science;

  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
            {doubt.studentAvatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <p className="text-sm font-semibold">{doubt.studentName}</p>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="h-2.5 w-2.5" />
                {doubt.askedAt}
              </p>
            </div>
            <div className="flex items-center gap-1.5">
              <Badge className={`${subjectStyle.bg} ${subjectStyle.text} hover:${subjectStyle.bg} text-[10px]`}>
                {doubt.subject}
              </Badge>
              {doubt.status === "answered" ? (
                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100 text-[10px]">
                  <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                  Answered
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-[10px]">
                  <Clock className="h-2.5 w-2.5 mr-1" />
                  Pending
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-3 rounded-lg bg-muted/40 border-l-4 border-primary">
        <p className="text-sm leading-relaxed">{doubt.question}</p>
        {doubt.attachments && doubt.attachments.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border">
            <Paperclip className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">
              {doubt.attachments.join(", ")}
            </span>
          </div>
        )}
      </div>

      {/* Answer */}
      {doubt.answer && (
        <div className="mt-3 flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-[10px] font-bold">
              {doubt.answeredBy?.split(" ").map((w) => w[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="text-sm font-semibold">{doubt.answeredBy}</p>
              <Badge variant="secondary" className="text-[9px]">Faculty</Badge>
              <span className="text-[10px] text-muted-foreground">• {doubt.answeredAt}</span>
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">
              {doubt.answer}
            </p>
            {doubt.helpfulCount !== undefined && doubt.helpfulCount > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <Button size="sm" variant="ghost" className="h-7 text-xs">
                  <ThumbsUp className="h-3 w-3 mr-1" />
                  Helpful ({doubt.helpfulCount})
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
