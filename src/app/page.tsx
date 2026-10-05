"use client";

import { useState } from "react";
import { SectionId, userProfile, notifications } from "@/lib/coaching-data";
import {
  courses,
  liveClasses,
  studyMaterials,
  testSeries,
  doubts,
} from "@/lib/coaching-data";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarContent, NotificationsSheet, mobileNavItems } from "@/components/coaching/Shell";
import { Menu, GraduationCap, Radio, Bell, Search } from "lucide-react";
// STATIC imports - shared modules compile once, reducing total memory
import { DashboardView } from "@/components/coaching/DashboardView";
import { CoursesView } from "@/components/coaching/CoursesView";
import { LiveClassesView } from "@/components/coaching/LiveClassesView";
import { StudyMaterialView } from "@/components/coaching/StudyMaterialView";
import { TestsView } from "@/components/coaching/TestsView";
import { DoubtsView } from "@/components/coaching/DoubtsView";
import { ProfileView } from "@/components/coaching/ProfileView";

function SectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-muted rounded" />
      <div className="h-4 w-72 bg-muted/60 rounded" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-24 bg-muted rounded-lg" />
        ))}
      </div>
      <div className="h-64 bg-muted/60 rounded-lg" />
    </div>
  );
}

export default function Home() {
  const [section, setSection] = useState<SectionId>("dashboard");
  const [notifOpen, setNotifOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const unreadNotifs = notifications.filter((n) => !n.isRead).length;

  const handleNavigate = (s: SectionId) => {
    setSection(s);
    setSidebarOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
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
                <p className="text-[10px] text-muted-foreground leading-tight">Smart Learning Platform</p>
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
                  {userProfile.avatar}
                </AvatarFallback>
              </Avatar>
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
            <div key={section} className="animate-slide-up">
              {section === "dashboard" && (
                <DashboardView onNavigate={(s) => handleNavigate(s as SectionId)} />
              )}
              {section === "courses" && <CoursesView courses={courses} />}
              {section === "live" && <LiveClassesView classes={liveClasses} />}
              {section === "study" && <StudyMaterialView materials={studyMaterials} />}
              {section === "tests" && <TestsView tests={testSeries} />}
              {section === "doubts" && <DoubtsView doubts={doubts} />}
              {section === "profile" && (
                <ProfileView onNavigate={(s) => handleNavigate(s as SectionId)} />
              )}
            </div>
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

      {/* Footer (desktop only) */}
      <footer className="hidden lg:block mt-auto border-t border-border bg-background">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <p>© 2026 Online Coaching. Built for smart learners.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>

      {/* Notifications sheet */}
      <NotificationsSheet open={notifOpen} onOpenChange={setNotifOpen} />
    </div>
  );
}
