"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  CheckCircle2, 
  Clock, 
  LayoutDashboard,
  LogOut,
  Terminal,
  ChevronRight,
  Lock,
  Menu,
  X,
  Layout,
  CreditCard,
  Settings,
  MessageSquare,
  ChevronDown
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { logout, getDashboardData } from "../actions";
import { FirstLoginOverlay } from "@/components/academy/FirstLoginOverlay";
import { ModeToggle } from "@/components/ModeToggle";
import { NotificationBell } from "@/components/academy/NotificationBell";

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  sessions?: {
    id: number;
    status: 'scheduled' | 'live' | 'archived';
    visibility_status: 'locked' | 'published';
  }[];
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [weeks, setWeeks] = useState<CohortWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModulesExpanded, setIsModulesExpanded] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [cohortName, setCohortName] = useState("");

  const fetchCurriculum = useCallback(async () => {
    try {
      const data = await getDashboardData();
      if (data && !data.error) {
        setWeeks(data.weeks || []);
        setIsFirstLogin(!!data.is_first_login);
        setCohortName(data.cohort_name || "your cohort");
        setIsReadOnly(data.status === 'graduated' || data.cohort_status === 'graduated');
      }
    } catch (err) {
      console.error("Failed to fetch curriculum:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);

  // Close mobile menu and scroll to top on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [pathname]);

  const NavItem = ({ href, label, icon, weekNumber, isCollapsed }: { href: string; label: string; icon: React.ReactNode; weekNumber?: number; isCollapsed?: boolean }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group relative ${
          isActive 
            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shadow-[0_4px_20px_rgba(234,179,8,0.05)]" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
        } ${isCollapsed ? "justify-center px-0" : ""}`}
        title={isCollapsed ? label : ""}
      >
        <div className={`flex-shrink-0 ${isActive ? "text-yellow-500" : "group-hover:text-yellow-500/70 transition-colors"}`}>
          {icon}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 group-hover:text-yellow-500/50 transition-colors">
              {weekNumber ? `Module ${weekNumber}` : "Control Center"}
            </p>
            <p className="text-sm font-semibold truncate tracking-tight">{label}</p>
          </div>
        )}
        {!isCollapsed && isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
        {isCollapsed && isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-yellow-500 rounded-l-full shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
        )}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground selection:bg-yellow-500/30 selection:text-yellow-200 w-full overflow-x-hidden">
      {isFirstLogin && <FirstLoginOverlay />}
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-40 px-6 flex items-center justify-between">
        <Link href="/academy" className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-yellow-500" />
          <span className="text-sm font-bold uppercase tracking-widest text-foreground">Kybern Academy</span>
        </Link>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-muted-foreground hover:text-yellow-500 transition-colors"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-20 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 bg-background border-r border-border flex flex-col z-45 transition-all duration-300 ease-in-out
        ${isMobileMenuOpen ? "translate-x-0 w-[280px]" : "-translate-x-full lg:translate-x-0"}
        ${!isSidebarOpen ? "lg:w-20" : "lg:w-72"}
      `}>
        <div className={`p-8 border-b border-border/50 flex items-center justify-between overflow-hidden ${!isSidebarOpen ? "px-5" : ""}`}>
          <Link href="/academy" className="flex items-center gap-3 transition-opacity hover:opacity-80 min-w-max">
            {isSidebarOpen ? (
              <>
                <img 
                  src="/logo-academy-dark.png" 
                  alt="Kybern Academy" 
                  className="hidden dark:block h-8 w-auto" 
                />
                <img 
                  src="/logo-academy-light.png" 
                  alt="Kybern Academy" 
                  className="block dark:hidden h-8 w-auto" 
                />
              </>
            ) : (
              <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
                <Terminal className="w-5 h-5 transition-transform group-hover:scale-110" />
              </div>
            )}
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden p-2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide mt-4">
          <div className="space-y-1">
            <NavItem 
              href="/academy/dashboard" 
              label="Overview" 
              icon={<LayoutDashboard className="w-5 h-5" />} 
              isCollapsed={!isSidebarOpen}
            />
            <NavItem 
              href="/academy/break-it-labs" 
              label="Break-It Labs" 
              icon={<Terminal className="w-5 h-5" />} 
              isCollapsed={!isSidebarOpen}
            />
            <NavItem 
              href="/academy/discussion-forum" 
              label="Threads" 
              icon={<MessageSquare className="w-5 h-5" />} 
              isCollapsed={!isSidebarOpen}
            />
            <NavItem
              href="/academy/dashboard/billing"
              label="Billing & Invoices"
              icon={<CreditCard className="w-5 h-5" />}
              isCollapsed={!isSidebarOpen}
            />
            <NavItem
              href="/academy/dashboard/settings"
              label="Profile Settings"
              icon={<Settings className="w-5 h-5" />}
              isCollapsed={!isSidebarOpen}
            />
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => isSidebarOpen && setIsModulesExpanded(!isModulesExpanded)}
              className={`
                w-full flex items-center justify-between px-4 py-2 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] hover:text-muted-foreground transition-colors
                ${!isSidebarOpen ? "justify-center px-0 cursor-default" : "cursor-pointer"}
              `}
            >
              {isSidebarOpen ? (
                <>
                  <span>Modules</span>
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isModulesExpanded ? "" : "-rotate-90"}`} />
                </>
              ) : (
                <div className="h-px w-8 bg-muted" />
              )}
            </button>
            <div className={`space-y-1 transition-all duration-300 overflow-hidden ${isModulesExpanded && isSidebarOpen ? "max-h-[1000px] opacity-100" : "max-h-0 lg:max-h-[1000px] opacity-0 lg:opacity-100"}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-muted/40 animate-pulse rounded-lg mx-auto" style={{ width: !isSidebarOpen ? '48px' : '100%' }} />
                ))
              ) : (
                weeks.map((week) => (
                  <NavItem 
                    key={week.id}
                    href={`/academy/dashboard/week/${week.id}`}
                    label={week.title}
                    weekNumber={week.week_number}
                    isCollapsed={!isSidebarOpen}
                    icon={(() => {
                      const publishedSessions = week.sessions || [];
                      const isLocked = publishedSessions.length === 0;
                      if (isLocked) return <Lock className="w-5 h-5 opacity-40" />;
                      
                      const hasLive = publishedSessions.some(s => s.status === 'live');
                      const allArchived = publishedSessions.every(s => s.status === 'archived');
                      
                      if (hasLive) return (
                        <div className="relative">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute inset-0" />
                          <div className="w-2 h-2 rounded-full bg-red-500 relative" />
                        </div>
                      );
                      
                      if (allArchived) return <CheckCircle2 className="w-5 h-5 text-emerald-500/80" />;
                      
                      return <Clock className="w-5 h-5 text-amber-500/80" />;
                    })()}
                  />
                ))
              )}
            </div>
          </div>
        </nav>

        <div className={`p-4 border-t border-border/50 space-y-2 ${!isSidebarOpen ? "items-center" : ""}`}>
          <div className={`flex items-center gap-3 w-full px-4 py-2 ${!isSidebarOpen ? "justify-center px-0" : ""}`}>
            <ModeToggle variant="academy" />
            {isSidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Theme Control</span>}
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="hidden lg:flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/5 rounded-xl transition-all group"
          >
            <Layout className={`w-5 h-5 transition-transform duration-500 ${!isSidebarOpen ? "rotate-180" : ""}`} />
            {isSidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest">Collapse View</span>}
          </button>
          
          <form action={logout}>
            <button className="flex items-center gap-3 w-full px-4 py-2.5 text-muted-foreground/60 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group">
              <LogOut className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              {isSidebarOpen && <span className="text-[10px] font-bold uppercase tracking-widest">Logout Session</span>}
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 min-h-screen min-w-0 overflow-x-hidden transition-all duration-300 pt-24 lg:pt-0 relative ${isSidebarOpen ? "lg:ml-72" : "lg:ml-20"}`}>
        {isReadOnly && (
          <div className="w-full bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-500 px-6 py-3 text-sm font-semibold flex items-center justify-center sticky top-0 z-10 backdrop-blur-md">
            <Lock className="w-4 h-4 mr-2" />
            You are viewing the archived workspace for {cohortName}.
          </div>
        )}
        <div className="p-4 sm:px-10 sm:pt-8 sm:pb-10 max-w-6xl mx-auto w-full min-w-0">
          <div className="hidden lg:flex justify-end mb-6">
            <NotificationBell />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
