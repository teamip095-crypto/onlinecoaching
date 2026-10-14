"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Upload,
  Video,
  FileText,
  Plus,
  Loader2,
  CheckCircle2,
  Link2,
  Users,
  PlayCircle,
  FileSpreadsheet,
  Copy,
  Check,
} from "lucide-react";

type Course = {
  id: string;
  title: string;
  subject: string;
  totalLessons: number;
  students: number;
  price: number;
};

export function FacultyDashboard() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showUpload, setShowUpload] = useState<
    | { type: "video" | "material"; courseId: string; courseTitle: string }
    | null
  >(null);
  const [shareableLink, setShareableLink] = useState<{
    title: string;
    url: string;
  } | null>(null);

  const loadCourses = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/courses", { credentials: "include" });
      const data = await r.json();
      // Faculty sees all courses (they own them); students only see published.
      // For faculty we show all
      setCourses(data.courses ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Faculty Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Create courses, upload videos & study material, manage your batch.
          </p>
        </div>
        <Button
          className="bg-coaching-gradient text-white"
          onClick={() => setShowCreate(true)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Course
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-primary">
            <Video className="h-4 w-4" />
            <span className="text-xs font-medium">Courses</span>
          </div>
          <p className="text-2xl font-bold mt-2">{courses.length}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <FileText className="h-4 w-4" />
            <span className="text-xs font-medium">Total Lessons</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {courses.reduce((s, c) => s + c.totalLessons, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">Total Students</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            {courses.reduce((s, c) => s + c.students, 0)}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <span className="text-xs font-medium">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold mt-2">
            ₹
            {courses
              .reduce((s, c) => s + c.students * (c.price / 100), 0)
              .toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </Card>
      </div>

      {/* Courses list with upload actions */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="h-24 animate-pulse" />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="h-14 w-14 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Video className="h-7 w-7 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mt-3">No courses yet</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Create your first course and start uploading lectures.
          </p>
          <Button
            className="mt-3 bg-coaching-gradient text-white"
            onClick={() => setShowCreate(true)}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Course
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {courses.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-[10px]">
                      {c.subject}
                    </Badge>
                    <Badge className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-[10px]">
                      ₹{(c.price / 100).toLocaleString()}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-sm">{c.title}</h3>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" />
                      {c.totalLessons} lessons
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {c.students} students
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setShowUpload({
                        type: "video",
                        courseId: c.id,
                        courseTitle: c.title,
                      })
                    }
                  >
                    <Video className="h-3.5 w-3.5 mr-1.5" />
                    Upload Video
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8"
                    onClick={() =>
                      setShowUpload({
                        type: "material",
                        courseId: c.id,
                        courseTitle: c.title,
                      })
                    }
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Upload Material
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create course modal */}
      <CreateCourseDialog
        open={showCreate}
        onOpenChange={setShowCreate}
        onCreated={() => loadCourses()}
      />

      {/* Upload modal */}
      {showUpload && (
        <UploadDialog
          open={!!showUpload}
          onOpenChange={(o) => !o && setShowUpload(null)}
          type={showUpload.type}
          courseId={showUpload.courseId}
          courseTitle={showUpload.courseTitle}
          onUploaded={(link, title) => {
            setShareableLink({ url: link, title });
            loadCourses();
          }}
        />
      )}

      {/* Shareable link modal */}
      <Dialog open={!!shareableLink} onOpenChange={(o) => !o && setShareableLink(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Upload Successful!
            </DialogTitle>
            <DialogDescription>
              "{shareableLink?.title}" is now live and protected.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-muted/60 border border-border">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                Shareable Online Link
              </p>
              <div className="flex items-center gap-2">
                <code className="text-xs flex-1 break-all">{shareableLink?.url}</code>
                <CopyButton text={shareableLink?.url ?? ""} />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Only students who have paid for this course can stream/download
              the content. The link is protected by server-side enrollment
              verification + per-user watermark.
            </p>
            <Button
              className="w-full bg-coaching-gradient text-white"
              onClick={() => setShareableLink(null)}
            >
              Done
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreateCourseDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreated: () => void;
}) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("499");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title,
          subject,
          description,
          price: Math.round(parseFloat(price) * 100), // rupees → paise
          badge: "NEW",
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Failed");
      setTitle("");
      setDescription("");
      setPrice("499");
      onOpenChange(false);
      onCreated();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
          <DialogDescription>
            Set up a new batch. You can upload lectures and material after creating.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ct" className="text-xs">Course Title</Label>
            <Input
              id="ct"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JEE 2026 Physics Full Batch"
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="cs" className="text-xs">Subject</Label>
              <select
                id="cs"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
                <option>Science</option>
                <option>PCM Complete</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cp" className="text-xs">Price (₹)</Label>
              <Input
                id="cp"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="499"
                className="h-10"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cd" className="text-xs">Description</Label>
            <Textarea
              id="cd"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn in this batch?"
              className="min-h-[80px]"
            />
          </div>
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}
          <Button
            disabled={loading || !title}
            onClick={submit}
            className="w-full bg-coaching-gradient text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : null}
            Create Course
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function UploadDialog({
  open,
  onOpenChange,
  type,
  courseId,
  courseTitle,
  onUploaded,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  type: "video" | "material";
  courseId: string;
  courseTitle: string;
  onUploaded: (link: string, title: string) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("Physics");
  const [isPreview, setIsPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    setLoading(true);
    setError(null);
    setProgress(0);
    try {
      const form = new FormData();
      form.append("file", file);
      form.append("courseId", courseId);
      form.append("title", title || file.name);
      form.append("subject", subject);
      form.append("isPreview", isPreview ? "true" : "false");
      if (type === "video") {
        form.append("type", "RECORDED");
      } else {
        form.append("type", file.name.match(/\.pdf$/i) ? "PDF" : "NOTE");
      }
      const endpoint = type === "video" ? "/api/upload/video" : "/api/upload/material";
      // Use XHR for progress tracking
      const xhr = new XMLHttpRequest();
      const result = await new Promise<{ ok: boolean; shareableLink?: string; error?: string; title?: string }>((resolve, reject) => {
        xhr.upload.addEventListener("progress", (e) => {
          if (e.lengthComputable) {
            setProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
        xhr.addEventListener("load", () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error ?? "Upload failed"));
            }
          } catch {
            reject(new Error("Invalid response"));
          }
        });
        xhr.addEventListener("error", () => reject(new Error("Network error")));
        xhr.open("POST", endpoint);
        xhr.withCredentials = true;
        xhr.send(form);
      });
      setFile(null);
      setTitle("");
      setProgress(0);
      onUploaded(result.shareableLink ?? "", result.title ?? title);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  };

  const maxSize = type === "video" ? 200 : 50;
  const accept = type === "video" ? "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" : ".pdf,.doc,.docx,.png,.jpg,.txt,.zip";
  const Icon = type === "video" ? Video : FileText;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            Upload {type === "video" ? "Lecture Video" : "Study Material"}
          </DialogTitle>
          <DialogDescription>
            For: {courseTitle}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="ut" className="text-xs">Title</Label>
            <Input
              id="ut"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === "video" ? "e.g. Rotational Motion - Lecture 5" : "e.g. DPP Sheet 04 - Calculus"}
              className="h-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="us" className="text-xs">Subject</Label>
              <select
                id="us"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option>Physics</option>
                <option>Chemistry</option>
                <option>Mathematics</option>
                <option>Biology</option>
                <option>Science</option>
              </select>
            </div>
            <div className="space-y-1.5 flex items-end">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPreview}
                  onChange={(e) => setIsPreview(e.target.checked)}
                  className="h-4 w-4"
                />
                Free preview (anyone can access)
              </label>
            </div>
          </div>
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:bg-muted/40 transition-colors"
          >
            <input
              ref={fileRef}
              type="file"
              accept={accept}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="hidden"
            />
            {file ? (
              <div className="text-sm">
                <p className="font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                <Icon className="h-8 w-8 mx-auto mb-2" />
                <p>Click to select file</p>
                <p className="text-[10px] mt-0.5">
                  Max {maxSize}MB • {type === "video" ? "MP4, WebM, MOV" : "PDF, DOC, PNG, JPG"}
                </p>
              </div>
            )}
          </div>
          {progress > 0 && progress < 100 && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-coaching-gradient transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
          )}
          <Button
            disabled={loading || !file}
            onClick={submit}
            className="w-full bg-coaching-gradient text-white"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {loading ? `Uploading... ${progress}%` : "Upload & Generate Link"}
          </Button>
          <p className="text-[10px] text-muted-foreground text-center">
            🔒 File will be protected: server-side enrollment check + per-user watermark + download disabled
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      size="sm"
      variant="outline"
      className="h-7 w-7 p-0"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}
