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
  Lock
} from "lucide-react";
import { useEffect, useState, useCallback } from "react";
import { logout, getDashboardData } from "../actions";

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  status: 'locked' | 'pre-flight' | 'live' | 'archived';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [weeks, setWeeks] = useState<CohortWeek[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCurriculum = useCallback(async () => {
    try {
      const data = await getDashboardData();
      if (data && !data.error) {
        setWeeks(data.weeks || []);
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

  const NavItem = ({ href, label, icon, weekNumber }: { href: string; label: string; icon: React.ReactNode; weekNumber?: number }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all group ${
          isActive 
            ? "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20" 
            : "text-slate-500 hover:text-slate-200 hover:bg-slate-900"
        }`}
      >
        <div className="flex-shrink-0">{icon}</div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-600 group-hover:text-yellow-500/50 transition-colors">
            {weekNumber ? `Module_0${weekNumber}` : "System"}
          </p>
          <p className="text-sm font-bold truncate tracking-tight">{label}</p>
        </div>
        {isActive && <ChevronRight className="w-4 h-4" />}
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-mono">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-72 bg-slate-950 border-r border-slate-900 hidden lg:flex flex-col z-50">
        <div className="p-8 border-b border-slate-900/50">
          <Link href="/academy" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] transition-all">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-slate-200 uppercase">Kybern Academy</h1>
              <p className="text-[10px] text-yellow-500/60 font-bold uppercase">Terminal_v4.0</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide">
          <div className="space-y-1">
            <NavItem href="/academy/dashboard" label="Overview" icon={<LayoutDashboard className="w-4 h-4" />} />
          </div>

          <div className="space-y-4">
            <h3 className="px-4 text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Curriculum_Path</h3>
            <div className="space-y-1">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 w-full bg-slate-900/50 animate-pulse rounded-lg" />
                ))
              ) : (
                weeks.map((week) => (
                  <NavItem 
                    key={week.id}
                    href={`/academy/dashboard/week/${week.id}`}
                    label={week.title}
                    weekNumber={week.week_number}
                    icon={
                      week.status === 'locked' ? <Lock className="w-4 h-4 opacity-50" /> :
                      week.status === 'archived' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> :
                      week.status === 'live' ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> : 
                      <Clock className="w-4 h-4 text-amber-500" />
                    }
                  />
                ))
              )}
            </div>
          </div>
        </nav>

        <div className="p-6 border-t border-slate-900/50">
          <form action={logout}>
            <button className="flex items-center gap-3 w-full px-4 py-3 text-slate-500 hover:text-red-400 hover:bg-red-500/5 rounded-xl transition-all group">
              <LogOut className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="text-sm font-bold uppercase tracking-widest">Disconnect</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-72 min-h-screen">
        <div className="p-4 sm:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
