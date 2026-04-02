import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Terminal, CheckCircle2, Clock, Calendar, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  return (
    <div className="space-y-12">
      {/* Main Header Integration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Mainframe_Overview</h1>
            <p className="text-slate-500 text-sm italic">Session: Cloud_Native_Mentorship_2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Waiting Room Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Terminal className="w-64 h-64 -mr-12 -mt-12" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold tracking-widest uppercase mb-6">
                STATUS: WEEK_0_WAITING_ROOM
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-slate-100">
                Welcome to the <span className="text-yellow-500">Cohort.</span>
              </h2>
              
              <p className="text-slate-400 leading-relaxed text-lg max-w-2xl mb-10">
                Seats are locked. Payment was successful. You are now officially enrolled in the specialized Cloud Native Mentorship program. We are strictly in pre-flight phase.
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
                  id: "01",
                  title: "Join Official Communications",
                  desc: "Connect with instructors and peers via the private Telegram group.",
                  action: "Connect Now",
                  link: "#",
                  icon: <ArrowRight className="w-4 h-4" />
                },
                {
                  id: "02",
                  title: "Provision Infrastructure",
                  desc: "Create your AWS or GCP Free Tier accounts. You'll need these for Day 1 labs.",
                  action: "View Specs",
                  link: "#",
                  icon: <ExternalLink className="w-4 h-4" />
                },
                {
                  id: "03",
                  title: "Understand DevOps Culture",
                  desc: "Familiarize yourself with the core principles of DevOps and its importance in modern software development.",
                  action: "Access Docs",
                  link: "#",
                  icon: <ArrowRight className="w-4 h-4" />
                }
              ].map((step) => (
                <div key={step.id} className="group flex items-start gap-6 p-6 hover:bg-slate-900 border border-transparent hover:border-slate-800 rounded-2xl transition-all">
                  <div className="text-yellow-500/50 font-bold text-lg mt-1">{step.id}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-200 mb-2 group-hover:text-yellow-500 transition-colors">{step.title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed max-w-xl">{step.desc}</p>
                  </div>
                  <Link href={step.link} className="flex items-center gap-2 text-xs text-slate-400 group-hover:text-yellow-500 transition-all font-bold tracking-widest uppercase">
                    {step.action}
                    {step.icon}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Mini Info Cards */}
        <div className="space-y-8">
          <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-3xl p-8">
            <h4 className="font-bold text-yellow-500 mb-4 tracking-tight uppercase text-xs">Curriculum_Access</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Week 1: Linux & Foundations</span>
                <span className="text-slate-600">Locked</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Week 2: Docker & Networking</span>
                <span className="text-slate-600">Locked</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Week 3: Kubernetes Depth</span>
                <span className="text-slate-600">Locked</span>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-6 border-t border-slate-800 pt-4 px-2">
                Modules unlock sequentially starting April 13th.
              </p>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8">
            <h4 className="font-bold text-slate-400 mb-6 tracking-tight uppercase text-xs">Support_Terminal</h4>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed">Logged issues or technical deployment blockers? Hit the academy support bridge.</p>
            <button className="w-full py-3 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 text-xs font-bold hover:border-yellow-500/30 transition-all">
              OPEN_SUPPORT_TICKET
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
