"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { SectionId } from "@/lib/coaching-data";
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
  Building2,
  Video,
  BookOpen,
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
import { FacultyDashboard } from "@/components/coaching/FacultyDashboard";
import { CoachingSetup } from "@/components/coaching/CoachingSetup";

type ExtendedSection = SectionId | "faculty" | "setup";
type NotificationsData = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function Home() {
  const { data: session, status } = useSession();
  const [section, setSection] = useState<ExtendedSection>("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
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
  const [notifications, setNotifications] = useState<NotificationsData[]>([]);
  const [paidCourseIds, setPaidCourseIds] = useState<Set<string>>(new Set());

  // Determine if user is faculty/owner
  const userRole = (session?.user as { role?: string } | null)?.role ?? "STUDENT";
  const isFaculty = ["FACULTY", "COACHING_OWNER", "SUPER_ADMIN"].includes(userRole);
  const hasCoaching = !!(session?.user as { coachingId?: string } | null)?.coachingId;

  const loadNotifications = useCallback(async () => {
    if (!session?.user) return;
    try {
      const r = await fetch("/api/notifications", { credentials: "include" });
      const data = await r.json();
      if (r.ok) {
        setNotifications(data.notifications ?? []);
      }
    } catch {
      // ignore
    }
  }, [session?.user]);

  const loadEnrollments = useCallback(async () => {
    if (!session?.user) return;
    try {
      const r = await fetch("/api/courses", { credentials: "include" });
      const data = await r.json();
      if (r.ok && data.enrollments) {
        const paidIds = new Set<string>();
        for (const [cid, info] of Object.entries(
          data.enrollments as Record<string, { enrolled: boolean; paid: boolean }>
        )) {
          if (info.paid) paidIds.add(cid);
        }
        setPaidCourseIds(paidIds);
      }
    } catch {
      // ignore
    }
  }, [session?.user]);

  useEffect(() => {
    if (!session?.user) return;
    let active = true;
    let p: Promise<void> = Promise.resolve();
    const run = () => {
      p = p.then(() => active && loadNotifications()).then(() => active && loadEnrollments()).catch(() => {});
    };
    run();
    return () => {
      active = false;
    };
  }, [session?.user, loadNotifications, loadEnrollments]);

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

  // Show setup wizard if requested
  if (showSetup) {
    return (
      <CoachingSetup
        onComplete={() => {
          setShowSetup(false);
          setSection("faculty");
          window.location.reload();
        }}
      />
    );
  }

  const user = {
    name: session.user.name ?? "Student",
    identifier:
      (session.user as { rollNo?: string }).rollNo ?? session.user.email ?? "",
    email: session.user.email ?? "",
  };
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const handleNavigate = (s: ExtendedSection) => {
    setSection(s);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Build dynamic sidebar items based on role
  const sidebarItems: {
    id: ExtendedSection;
    label: string;
    short: string;
    icon: typeof Menu;
    badge?: string;
  }[] = [
    { id: "dashboard", label: "Dashboard", short: "Home", icon: GraduationCap },
    { id: "courses", label: "Courses", short: "Courses", icon: BookOpen },
    { id: "live", label: "Live Classes", short: "Live", icon: Video, badge: "1" },
    { id: "study", label: "Study Material", short: "Notes", icon: BookOpen },
    { id: "tests", label: "Test Series", short: "Tests", icon: BookOpen },
    { id: "doubts", label: "Doubt Solving", short: "Doubts", icon: BookOpen },
    ...(isFaculty
      ? [{ id: "faculty" as const, label: "Faculty Panel", short: "Faculty", icon: Video }]
      : []),
    { id: "profile", label: "My Profile", short: "Profile", icon: BookOpen },
  ];

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
                  <DynamicSidebar
                    section={section}
                    onNavigate={handleNavigate}
                    items={sidebarItems}
                    isFaculty={isFaculty}
                    hasCoaching={hasCoaching}
                    onShowSetup={() => setShowSetup(true)}
                  />
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
            <DynamicSidebar
              section={section}
              onNavigate={handleNavigate}
              items={sidebarItems}
              isFaculty={isFaculty}
              hasCoaching={hasCoaching}
              onShowSetup={() => setShowSetup(true)}
            />
          </aside>

          <main className="flex-1 min-w-0 pb-20 lg:pb-6">
            <div className="max-w-6xl mx-auto p-4 lg:p-6">
              <Watermark
                name={user.name}
                identifier={user.identifier}
                density="low"
                opacity={0.04}
              >
                <div key={section} className="animate-slide-up">
                  {section === "dashboard" && (
                    <DashboardView
                      onNavigate={(s) => handleNavigate(s as ExtendedSection)}
                    />
                  )}
                  {section === "courses" && (
                    <CoursesView
                      onUnlock={(c) =>
                        setPaywall({
                          courseId: c.id,
                          title: c.title,
                          price: c.price,
                        })
                      }
                      onPlayPreview={(c) =>
                        setLecturePlayer({
                          id: c.id,
                          title: c.title,
                          faculty: c.faculty,
                          subject: c.subject,
                        })
                      }
                    />
                  )}
                  {section === "live" && (
                    <LiveClassesView
                      classes={[]}
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
                    <StudyMaterialView paidCourseIds={paidCourseIds} />
                  )}
                  {section === "tests" && <TestsView tests={[]} />}
                  {section === "doubts" && <DoubtsView doubts={[]} />}
                  {section === "faculty" && isFaculty && <FacultyDashboard />}
                  {section === "profile" && (
                    <ProfileView
                      onNavigate={(s) => handleNavigate(s as ExtendedSection)}
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
                  onClick={() => handleNavigate(item.id as ExtendedSection)}
                  className={`flex flex-col items-center justify-center gap-0.5 relative transition-colors ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "fill-primary/20" : ""}`} />
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

        {/* Notifications sheet */}
        <NotificationsSheetReal
          open={notifOpen}
          onOpenChange={setNotifOpen}
          notifications={notifications}
          onMarkAllRead={async () => {
            await fetch("/api/notifications", { method: "PATCH", credentials: "include" });
            loadNotifications();
          }}
        />

        {paywall && (
          <PaymentGate
            open={!!paywall}
            onOpenChange={(o) => !o && setPaywall(null)}
            courseId={paywall.courseId}
            courseTitle={paywall.title}
            price={paywall.price}
            onSuccess={() => {
              loadEnrollments();
            }}
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

// Sidebar that adapts to user role (faculty/owner sees more)
function DynamicSidebar({
  section,
  onNavigate,
  items,
  isFaculty,
  hasCoaching,
  onShowSetup,
}: {
  section: ExtendedSection;
  onNavigate: (s: ExtendedSection) => void;
  items: { id: ExtendedSection; label: string; short: string; icon: typeof Menu }[];
  isFaculty: boolean;
  hasCoaching: boolean;
  onShowSetup: () => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <div className="h-14 lg:h-16 px-4 flex items-center gap-2 border-b border-sidebar-border">
        <div className="h-8 w-8 rounded-lg bg-coaching-gradient flex items-center justify-center shrink-0">
          <GraduationCap className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="font-bold text-sm leading-tight truncate">Online Coaching</p>
          <p className="text-[10px] text-muted-foreground leading-tight truncate">Smart Learning</p>
        </div>
      </div>

      <nav className="flex-1 p-2 overflow-y-auto scrollbar-thin">
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Main Menu
        </p>
        <div className="space-y-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? "" : "text-muted-foreground"}`} />
                <span className="flex-1 text-left">{item.label}</span>
              </button>
            );
          })}
        </div>

        {isFaculty && !hasCoaching && (
          <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 mb-1 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Setup Your Coaching
            </p>
            <p className="text-[10px] text-amber-700/80 dark:text-amber-300/80 mb-2">
              Create your coaching institute, choose plan, scan UPI QR to activate.
            </p>
            <Button
              size="sm"
              className="w-full h-7 text-xs bg-amber-500 hover:bg-amber-600 text-white"
              onClick={onShowSetup}
            >
              Start Setup
            </Button>
          </div>
        )}
      </nav>
    </div>
  );
}

// Real notifications sheet
function NotificationsSheetReal({
  open,
  onOpenChange,
  notifications,
  onMarkAllRead,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  notifications: NotificationsData[];
  onMarkAllRead: () => void;
}) {
  const unread = notifications.filter((n) => !n.isRead).length;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-semibold text-base">Notifications</h2>
            <Badge variant="secondary" className="text-[10px]">{unread} unread</Badge>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 border-b border-border hover:bg-muted/40 transition-colors cursor-pointer ${
                    !n.isRead ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 text-xs">
                      {n.type === "CLASS" ? "🎥" : n.type === "TEST" ? "📝" : n.type === "MATERIAL" ? "📚" : n.type === "DOUBT" ? "💬" : "💳"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold leading-tight">{n.title}</p>
                        {!n.isRead && <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(n.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-3 border-t border-border">
            <Button
              variant="ghost"
              className="w-full h-8 text-xs"
              onClick={onMarkAllRead}
              disabled={unread === 0}
            >
              Mark all as read
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
