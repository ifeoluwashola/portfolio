import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Terminal, CheckCircle2, Clock, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";
import { getDashboardData } from "../actions";

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  status: 'locked' | 'pre-flight' | 'live' | 'archived' | string;
}

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  const data = await getDashboardData();
  const weeks: CohortWeek[] = data.weeks || [];

  return (
    <div className="space-y-12">
      {/* Main Header Integration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dashboard Overview</h1>
            <p className="text-slate-500 text-sm">Session: Cloud Native Mentorship 2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Enrollment Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Terminal className="w-64 h-64 -mr-12 -mt-12" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold tracking-widest uppercase mb-6">
                STATUS: ENROLLMENT ACTIVE
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-100">
                Welcome to the <span className="text-yellow-500 underline decoration-yellow-500/30 underline-offset-8">Cohort.</span>
              </h2>
              
              <p className="text-slate-400 leading-relaxed text-lg max-w-2xl mb-10">
                Seats are locked. Access granted. You are now officially enrolled in the specialized Cloud Native Mentorship program. Complete your pre-flight checks below.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 p-6 bg-slate-950/50 border border-slate-800/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  <span className="text-slate-200">Start Date: <span className="text-yellow-400 font-bold">April 16th</span></span>
                </div>
                <div className="h-4 w-px bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-slate-200">Session: <span className="text-yellow-400 font-bold">9:00 PM WAT</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Area */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 sm:p-10">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-yellow-500" />
              Pre-Flight Checklist
            </h3>

            <div className="space-y-6">
              {[
                {
                  id: "1",
                  title: "Join Official Communications",
                  desc: "Connect with instructors and peers via the private Telegram group.",
                  action: "Connect Now",
                  link: "https://t.me/+VxGj5OzwDNJhY2Zk",
                  icon: <ExternalLink className="w-4 h-4" />
                },
                {
                  id: "2",
                  title: "Provision Infrastructure",
                  desc: "Create your AWS and GCP Free Tier accounts. Direct links provided for console access.",
                  action: "Provision Now",
                  subActions: [
                    { label: "AWS Console", link: "https://portal.aws.amazon.com/gp/aws/developer/registration/index.html" },
                    { label: "GCP Console", link: "https://console.cloud.google.com/registration/freeTrial" }
                  ],
                  icon: <ExternalLink className="w-4 h-4" />
                },
                {
                  id: "3",
                  title: "Understand DevOps Culture",
                  desc: "Familiarize yourself with the core principles of DevOps and its importance in modern software development.",
                  action: "Access Docs",
                  link: "/academy/materials/introduction-to-devops",
                  icon: <ArrowRight className="w-4 h-4" />
                }
              ].map((step) => (
                <div key={step.id} className="group flex items-start gap-6 p-6 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-2xl transition-all">
                  <div className="text-yellow-500/50 font-bold text-lg mt-1 pr-2">{step.id}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-200 mb-2 group-hover:text-yellow-500 transition-colors uppercase tracking-tight">{step.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{step.desc}</p>
                    {step.subActions && (
                      <div className="flex gap-4 mt-4">
                        {step.subActions.map((sub, idx) => (
                          <Link key={idx} href={sub.link} target="_blank" className="px-3 py-1 bg-slate-950 border border-slate-800 rounded text-[10px] font-bold text-slate-400 hover:text-yellow-500 hover:border-yellow-500/30 transition-all uppercase tracking-widest">
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {!step.subActions && (
                    <Link href={step.link} className="flex items-center gap-2 text-[10px] text-slate-400 group-hover:text-yellow-500 transition-all font-bold tracking-widest uppercase">
                      {step.action}
                      {step.icon}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Info Cards */}
        <div className="space-y-8">
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Calendar className="w-16 h-16" />
            </div>
            <h4 className="font-bold text-yellow-500 mb-6 tracking-tight uppercase text-xs">Module Roadmap Snapshot</h4>
            <div className="space-y-4 relative z-10">
              {weeks.slice(0, 5).map((week: { id: number; week_number: number; title: string; status: string }) => (
                <div key={week.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-400 font-semibold tracking-tight">Week {week.week_number}: {week.title.split(' ').slice(0, 2).join(' ')}...</span>
                  <Badge status={week.status} />
                </div>
              ))}
              <div className="pt-4 border-t border-slate-800 mt-4">
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  The roadmap is live. Modules unlock as we progress through the 12-week deployment cycle.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h4 className="font-bold text-slate-400 mb-6 tracking-tight uppercase text-xs">Support Terminal</h4>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Logged issues or technical deployment blockers? Hit the academy support bridge for immediate triage.</p>
            <button className="w-full py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-[10px] font-bold tracking-widest hover:border-yellow-500/30 hover:text-yellow-500 transition-all uppercase">
              OPEN SUPPORT TICKET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ status }: { status: 'locked' | 'pre-flight' | 'live' | 'archived' | string }) {
  const styles: Record<string, string> = {
    locked: "text-slate-600",
    "pre-flight": "text-amber-500/80",
    live: "text-emerald-500 animate-pulse font-bold",
    archived: "text-sky-500/80"
  };
  return <span className={`text-[10px] uppercase font-bold tracking-widest ${styles[status] || "text-slate-600"}`}>{status}</span>;
}
