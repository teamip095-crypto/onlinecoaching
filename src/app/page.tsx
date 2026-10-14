"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { SectionId, userProfile as staticProfile } from "@/lib/coaching-data";
import {
  courses as staticCourses,
  liveClasses,
  studyMaterials as staticMaterials,
  testSeries,
  doubts as staticDoubts,
  notifications as staticNotifications,
  dashboardStats,
} from "@/lib/coaching-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  SidebarContent,
  NotificationsSheet,
  mobileNavItems,
} from "@/components/coaching/Shell";
import {
  Menu,
  GraduationCap,
  Radio,
  Bell,
  Search,
  LogOut,
  ShieldCheck,
  Loader2,
} from "lucide-react";

import { AuthScreen } from "@/components/coaching/AuthScreen";
import { DashboardView } from "@/components/coaching/DashboardView";
import { CoursesView } from "@/components/coaching/CoursesView";
import { LiveClassesView } from "@/components/coaching/LiveClassesView";
import { StudyMaterialView } from "@/components/coaching/StudyMaterialView";
import { TestsView } from "@/components/coaching/TestsView";
import { DoubtsView } from "@/components/coaching/DoubtsView";
import { ProfileView } from "@/components/coaching/ProfileView";
import { PaymentGate } from "@/components/coaching/PaymentGate";
import { LectureViewer } from "@/components/coaching/LectureViewer";
import { ContentGuard } from "@/components/coaching/ContentGuard";
import { Watermark } from "@/components/coaching/Watermark";

type CourseItem = {
  id: string;
  title: string;
  slug: string;
  subject: string;
  facultyName: string;
  facultyAvatar: string | null;
  totalLessons: number;
  students: number;
  rating: number;
  price: number;
  badge: string | null;
};

type EnrollmentMap = Record<string, { enrolled: boolean; paid: boolean }>;

export default function Home() {
  const { data: session, status } = useSession();
  const [section, setSection] = useState<SectionId>("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [enrollments, setEnrollments] = useState<EnrollmentMap>({});
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [paywall, setPaywall] = useState<{
    courseId: string;
    title: string;
    price: number;
  } | null>(null);
  const [lecturePlayer, setLecturePlayer] = useState<{
    id: string;
    title: string;
    faculty: string;
    subject: string;
    isPreview?: boolean;
  } | null>(null);

  const loadCourses = useCallback(async () => {
    try {
      setLoadingCourses(true);
      const r = await fetch("/api/courses", { credentials: "include" });
      const data = await r.json();
      if (r.ok) {
        setCourses(data.courses ?? []);
        setEnrollments(data.enrollments ?? {});
      }
    } catch {
      // keep empty
    } finally {
      setLoadingCourses(false);
    }
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadCourses();
    }
  }, [session?.user, loadCourses]);

  // Show loading while session is being fetched
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto" />
          <p className="text-sm text-muted-foreground mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  // Not logged in → show auth screen
  if (!session?.user) {
    return <AuthScreen />;
  }

  const user = {
    name: session.user.name ?? "Student",
    identifier:
      (session.user as { rollNo?: string }).rollNo ?? session.user.email ?? "",
    email: session.user.email ?? "",
  };
  const unreadNotifs = staticNotifications.filter((n) => !n.isRead).length;

  const handleNavigate = (s: SectionId) => {
    setSection(s);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Map DB courses to the format used by CoursesView
  const courseCards = courses.map((c) => {
    const status = enrollments[c.id] ?? { enrolled: false, paid: false };
    const subjectStyle = SUBJECT_COLORS[c.subject] ?? SUBJECT_COLORS.Science;
    return {
      id: c.id,
      title: c.title,
      subject: c.subject,
      faculty: c.facultyName,
      facultyAvatar: c.facultyAvatar ?? c.facultyName.slice(0, 2).toUpperCase(),
      thumbnail: subjectStyle.thumb,
      totalLessons: c.totalLessons,
      completedLessons: status.enrolled ? Math.floor(c.totalLessons * 0.3) : 0,
      progress: status.enrolled ? 30 : 0,
      students: c.students,
      rating: c.rating,
      nextClass: "Today" as const,
      nextClassTime: "10:00 AM",
      badge: c.badge ?? (status.paid ? "ENROLLED" : "PAY TO UNLOCK"),
      paid: status.paid,
      price: c.price,
    };
  });

  return (
    <ContentGuard blurOnDevtools={false}>
      <div className="min-h-screen flex flex-col bg-background">
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
          <div className="flex items-center justify-between gap-3 px-4 h-14 lg:h-16">
            <div className="flex items-center gap-2">
              <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                  <SidebarContent section={section} onNavigate={handleNavigate} />
                </SheetContent>
              </Sheet>

              <button
                onClick={() => handleNavigate("dashboard")}
                className="flex items-center gap-2"
              >
                <div className="h-8 w-8 rounded-lg bg-coaching-gradient flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <p className="font-bold text-sm leading-tight">Online Coaching</p>
                  <p className="text-[10px] text-muted-foreground leading-tight flex items-center gap-1">
                    <ShieldCheck className="h-2.5 w-2.5" />
                    Secure Platform
                  </p>
                </div>
              </button>
            </div>

            <div className="hidden md:flex flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  placeholder="Search courses, tests, study material..."
                  className="w-full h-9 pl-9 pr-3 rounded-md bg-muted/50 border-0 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="hidden sm:flex h-9 px-3 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                onClick={() => handleNavigate("live")}
              >
                <Radio className="h-3.5 w-3.5 mr-1.5 animate-pulse-soft" />
                <span className="text-xs font-semibold">1 Live</span>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 relative"
                onClick={() => setNotifOpen(true)}
              >
                <Bell className="h-5 w-5" />
                {unreadNotifs > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadNotifs}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="h-9 px-1.5"
                onClick={() => handleNavigate("profile")}
              >
                <Avatar className="h-7 w-7">
                  <AvatarFallback className="bg-coaching-gradient text-white text-[10px] font-bold">
                    {user.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={() => signOut({ callbackUrl: "/" })}
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Body: sidebar + main content */}
        <div className="flex flex-1">
          <aside className="hidden lg:block w-60 shrink-0 border-r border-border bg-sidebar">
            <SidebarContent section={section} onNavigate={handleNavigate} />
          </aside>

          <main className="flex-1 min-w-0 pb-20 lg:pb-6">
            <div className="max-w-6xl mx-auto p-4 lg:p-6">
              {/* Subtle user watermark on all app content */}
              <Watermark
                name={user.name}
                identifier={user.identifier}
                density="low"
                opacity={0.04}
              >
                <div key={section} className="animate-slide-up">
                  {section === "dashboard" && (
                    <DashboardView
                      onNavigate={(s) => handleNavigate(s as SectionId)}
                    />
                  )}
                  {section === "courses" && (
                    <SecuredCoursesView
                      loading={loadingCourses}
                      courseCards={courseCards}
                      onUnlock={(c) =>
                        setPaywall({
                          courseId: c.id,
                          title: c.title,
                          price: c.price ?? 0,
                        })
                      }
                      onPlayPreview={(c) =>
                        setLecturePlayer({
                          id: "preview-" + c.id,
                          title: c.title,
                          faculty: c.faculty,
                          subject: c.subject,
                          isPreview: true,
                        })
                      }
                    />
                  )}
                  {section === "live" && (
                    <LiveClassesView
                      classes={liveClasses}
                      onJoin={(cls) =>
                        setLecturePlayer({
                          id: "demo-lecture",
                          title: cls.title,
                          faculty: cls.faculty,
                          subject: cls.subject,
                        })
                      }
                    />
                  )}
                  {section === "study" && (
                    <StudyMaterialView materials={staticMaterials} />
                  )}
                  {section === "tests" && <TestsView tests={testSeries} />}
                  {section === "doubts" && <DoubtsView doubts={staticDoubts} />}
                  {section === "profile" && (
                    <ProfileView
                      onNavigate={(s) => handleNavigate(s as SectionId)}
                    />
                  )}
                </div>
              </Watermark>
            </div>
          </main>
        </div>

        {/* Mobile bottom nav */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border">
          <div className="grid grid-cols-5 h-16">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigate(item.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="relative">
                    <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
                    {item.badge && (
                      <span
                        className={`absolute -top-1 -right-2 h-3.5 min-w-3.5 px-1 rounded-full text-[8px] font-bold flex items-center justify-center ${
                          item.badgeVariant === "destructive"
                            ? "bg-rose-500 text-white"
                            : "bg-primary text-primary-foreground"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-medium leading-none">{item.short}</span>
                  {active && (
                    <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-primary" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <footer className="hidden lg:block mt-auto border-t border-border bg-background">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <p>© 2026 Online Coaching. Secured, watermarked, anti-piracy protected.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Support</a>
            </div>
          </div>
        </footer>

        <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />

        {paywall && (
          <PaymentGate
            open={!!paywall}
            onOpenChange={(o) => !o && setPaywall(null)}
            courseId={paywall.courseId}
            courseTitle={paywall.title}
            price={paywall.price}
            onSuccess={loadCourses}
          />
        )}

        {lecturePlayer && (
          <LectureViewer
            lectureId={lecturePlayer.id}
            title={lecturePlayer.title}
            faculty={lecturePlayer.faculty}
            subject={lecturePlayer.subject}
            isPreview={lecturePlayer.isPreview}
            user={user}
            onClose={() => setLecturePlayer(null)}
          />
        )}
      </div>
    </ContentGuard>
  );
}

const SUBJECT_COLORS: Record<string, { thumb: string }> = {
  Physics: { thumb: "physics" },
  Chemistry: { thumb: "chemistry" },
  Mathematics: { thumb: "math" },
  Biology: { thumb: "biology" },
  Science: { thumb: "science" },
  PCM: { thumb: "physics" },
  "PCM Complete": { thumb: "physics" },
};

// Wrapper around CoursesView that adds lock state for unpaid courses
function SecuredCoursesView({
  loading,
  courseCards,
  onUnlock,
  onPlayPreview,
}: {
  loading: boolean;
  courseCards: Array<{
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
    nextClass: string;
    nextClassTime: string;
    badge: string;
    paid: boolean;
    price: number;
  }>;
  onUnlock: (c: { id: string; title: string; price: number }) => void;
  onPlayPreview: (c: { id: string; title: string; faculty: string; subject: string }) => void;
}) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Loading your batches...</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-muted rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }
  if (courseCards.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            No courses available yet. Check back soon!
          </p>
        </div>
      </div>
    );
  }
  return (
    <CoursesView
      courses={courseCards}
      onOpenCourse={(c: any) => {
        if (c.paid) {
          onPlayPreview({
            id: c.id,
            title: c.title,
            faculty: c.faculty,
            subject: c.subject,
          });
        } else {
          onUnlock({ id: c.id, title: c.title, price: c.price ?? 0 });
        }
      }}
    />
  );
}
