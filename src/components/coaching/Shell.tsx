"use client";

import { SectionId, notifications, userProfile } from "@/lib/coaching-data";
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
  Home,
  BookOpen,
  Video,
  FileText,
  ClipboardCheck,
  MessageCircleQuestion,
  User,
  Bell,
  Search,
  Menu,
  GraduationCap,
  Radio,
} from "lucide-react";
import { dashboardStats } from "@/lib/coaching-data";

type NavItem = {
  id: SectionId;
  label: string;
  short: string;
  icon: typeof Home;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
};

export const navItems: NavItem[] = [
  { id: "dashboard", label: "Dashboard", short: "Home", icon: Home },
  { id: "courses", label: "My Courses", short: "Courses", icon: BookOpen },
  { id: "live", label: "Live Classes", short: "Live", icon: Video, badge: "LIVE", badgeVariant: "destructive" },
  { id: "study", label: "Study Material", short: "Notes", icon: FileText },
  { id: "tests", label: "Test Series", short: "Tests", icon: ClipboardCheck, badge: String(dashboardStats.pendingTests) },
  { id: "doubts", label: "Doubt Solving", short: "Doubts", icon: MessageCircleQuestion, badge: String(dashboardStats.pendingDoubts) },
  { id: "profile", label: "My Profile", short: "Profile", icon: User },
];

export const mobileNavItems: NavItem[] = [
  { id: "dashboard", label: "Home", short: "Home", icon: Home },
  { id: "courses", label: "Courses", short: "Courses", icon: BookOpen },
  { id: "live", label: "Live", short: "Live", icon: Video, badge: "LIVE", badgeVariant: "destructive" },
  { id: "tests", label: "Tests", short: "Tests", icon: ClipboardCheck },
  { id: "profile", label: "Profile", short: "Profile", icon: User },
];

export function SidebarContent({
  section,
  onNavigate,
}: {
  section: SectionId;
  onNavigate: (s: SectionId) => void;
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
          {navItems.map((item) => {
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
                {item.badge && (
                  <Badge
                    variant={active ? "secondary" : item.badgeVariant ?? "secondary"}
                    className={`text-[9px] h-4 px-1 ${
                      active
                        ? "bg-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
                        : item.badgeVariant === "destructive"
                          ? "bg-rose-500 text-white hover:bg-rose-500"
                          : ""
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <p className="px-3 py-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Help
        </p>
        <div className="space-y-0.5">
          <button className="w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Bell className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">Notifications</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 h-10 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent transition-colors">
            <Search className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-left">Help Center</span>
          </button>
        </div>
      </nav>

      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={() => onNavigate("profile")}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent transition-colors"
        >
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-coaching-gradient text-white text-xs font-bold">
              {userProfile.avatar}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold truncate">{userProfile.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{userProfile.rollNo}</p>
          </div>
        </button>
      </div>
    </div>
  );
}

export function NotifIcon({ type }: { type: "class" | "test" | "material" | "doubt" | "payment" }) {
  const icons = {
    class: <Video className="h-4 w-4" />,
    test: <ClipboardCheck className="h-4 w-4" />,
    material: <FileText className="h-4 w-4" />,
    doubt: <MessageCircleQuestion className="h-4 w-4" />,
    payment: <Bell className="h-4 w-4" />,
  };
  return icons[type];
}

export function NotificationsSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const unreadNotifs = notifications.filter((n) => !n.isRead).length;
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-96 p-0">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-base">Notifications</h2>
              <Badge variant="secondary" className="text-[10px]">
                {unreadNotifs} unread
              </Badge>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-4 border-b border-border hover:bg-muted/40 transition-colors cursor-pointer ${
                  !n.isRead ? "bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <NotifIcon type={n.type} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 justify-between">
                      <p className="text-sm font-semibold leading-tight">{n.title}</p>
                      {!n.isRead && (
                        <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <Button variant="ghost" className="w-full h-8 text-xs" onClick={() => onOpenChange(false)}>
              Mark all as read
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
