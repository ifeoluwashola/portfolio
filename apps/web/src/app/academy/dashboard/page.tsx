import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Terminal, CheckCircle2, Clock, LogOut, ArrowRight, Lock, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { logout, changePassword } from "../actions";

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  // Manually decode JWT payload to check is_first_login
  let isFirstLogin = false;
  try {
    const payloadBase64 = token.split(".")[1];
    const decodedPayload = JSON.parse(Buffer.from(payloadBase64, "base64").toString());
    isFirstLogin = decodedPayload.is_first_login;
  } catch (err) {
    console.error("Failed to decode token", err);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-mono p-4 sm:p-8">
      {/* First Login Overlay */}
      {isFirstLogin && (
        <div className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-yellow-500/30 rounded-2xl p-8 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
            <div className="flex flex-col items-center text-center mb-8">
              <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 border border-yellow-500/20">
                <Lock className="w-8 h-8 text-yellow-500" />
              </div>
              <h2 className="text-2xl font-bold text-yellow-500 tracking-tight">Security Alert</h2>
              <p className="text-slate-400 text-sm mt-2">Temporary password detected. You must update your credentials before proceeding to the terminal.</p>
            </div>

            <form action={changePassword} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase tracking-widest">Set New Password</label>
                <input
                  type="password"
                  name="new_password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-yellow-500 focus:outline-none focus:border-yellow-500/50 transition-all"
                />
                <p className="text-[10px] text-slate-600 italic mt-1">Min. 8 characters requirement.</p>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)]"
              >
                UPDATE_CREDENTIALS && RE_LOGIN
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cohort Welcome</h1>
            <p className="text-slate-500 text-sm">Session: Cloud Native Mentorship 2026</p>
          </div>
        </div>

        <form action={logout}>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-red-400 hover:border-red-400/30 transition-all text-sm">
            <LogOut className="w-4 h-4" />
            DISCONNECT_SESSION
          </button>
        </form>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
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
                  <span className="text-slate-200">Start Date: <span className="text-yellow-400 font-bold">April 13th</span></span>
                </div>
                <div className="h-4 w-px bg-slate-800 hidden sm:block" />
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-slate-200">Session: <span className="text-yellow-400 font-bold">7:00 PM WAT</span></span>
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
                  desc: "Connect with instructors and peers via the private WhatsApp/Telegram bridge.",
                  action: "Connect Now",
                  link: "#",
                  icon: <ArrowRight className="w-4 h-4" />
                },
                {
                  id: "02",
                  title: "Provision Infrastructure",
                  desc: "Create your AWS and GCP Free Tier accounts. You'll need these for Day 1 labs.",
                  action: "View Specs",
                  link: "#",
                  icon: <ExternalLink className="w-4 h-4" />
                },
                {
                  id: "03",
                  title: "Review Linux Basics",
                  desc: "Refresh your CLI knowledge: bash, systemd, networking, and standard protocols.",
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
