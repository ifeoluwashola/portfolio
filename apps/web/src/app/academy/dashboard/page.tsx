import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Terminal, CheckCircle2, Clock, Calendar, ArrowRight, ExternalLink, AlertTriangle, ShieldX } from "lucide-react";
import Link from "next/link";
import { getDashboardData, getBillingStatus } from "../actions";
import { AutoRefresher } from "@/components/academy/auto-refresher";

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

export default async function StudentDashboard() {
  const cookieStore = await cookies();
  const token = cookieStore.get("academy_token")?.value;

  if (!token) {
    redirect("/academy/login");
  }

  const [data, billingResult] = await Promise.all([
    getDashboardData(),
    getBillingStatus(),
  ]);

  const weeks: CohortWeek[] = data.weeks || [];
  const billing = "error" in billingResult ? null : billingResult;
  const remainingKobo = billing ? billing.total_due - billing.total_paid : 0;

  const formatNaira = (kobo: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(kobo / 100);

  const formatDate = (iso: string | null) =>
    iso ? new Intl.DateTimeFormat("en-NG", { day: "numeric", month: "long", year: "numeric" }).format(new Date(iso)) : "";

  const isLocked = billing?.billing_status === "payment_locked";
  const hasBalance = billing && billing.billing_status !== "paid_in_full" && remainingKobo > 0;

  return (
    <div className="space-y-8">
      <AutoRefresher />

      {/* ── Billing CTA Widget ── */}
      {isLocked && (
        <div className="flex items-start gap-4 bg-red-500/8 border border-red-500/30 rounded-2xl p-5 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
            <ShieldX className="w-5 h-5 text-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-red-600 dark:text-red-400/70 mb-1">Action Required</p>
            <h3 className="text-base font-bold text-red-600 dark:text-red-300 mb-1">Access Suspended — Overdue Balance</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Your portal access is restricted due to a missed installment payment.
              {billing?.next_payment_due_date && ` Payment was due ${formatDate(billing.next_payment_due_date)}.`}
            </p>
          </div>
          <Link
            href="/academy/dashboard/billing"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-red-500 hover:bg-red-400 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]"
          >
            Complete Payment
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {!isLocked && hasBalance && billing?.billing_status === "good_standing" && (
        <div className="flex items-center gap-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
          <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-amber-600 dark:text-amber-300">
              Next Installment Due: <span className="font-bold">{formatDate(billing.next_payment_due_date)}</span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              Remaining balance: {formatNaira(remainingKobo)}
            </p>
          </div>
          <Link
            href="/academy/dashboard/billing"
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-bold uppercase tracking-widest rounded-xl transition-all"
          >
            Make Payment
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Main Header Integration */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center justify-center text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.1)]">
            <Terminal className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Dashboard Overview</h1>
            <p className="text-muted-foreground text-sm">Session: Cloud Native Mentorship 2026</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Enrollment Card */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-card border border-border rounded-3xl p-8 sm:p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 text-foreground">
              <Terminal className="w-64 h-64 -mr-12 -mt-12" />
            </div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold tracking-widest uppercase mb-6">
                STATUS: ENROLLMENT ACTIVE
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-foreground">
                Welcome to the <span className="text-yellow-500 underline decoration-yellow-500/30 underline-offset-8">Cohort.</span>
              </h2>
              
              <p className="text-muted-foreground leading-relaxed text-lg max-w-2xl mb-10">
                Enrollment confirmed. Access granted. You are now officially enrolled in the specialized Cloud Native Mentorship program. Complete your pre-flight checks below.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 p-6 bg-background/50 border border-border/50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-yellow-500" />
                  <span className="text-foreground">Start Date: <span className="text-yellow-600 dark:text-yellow-400 font-bold">May 18th</span></span>
                </div>
                <div className="h-4 w-px bg-border hidden sm:block" />
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-yellow-500" />
                  <span className="text-foreground">Session: <span className="text-yellow-600 dark:text-yellow-400 font-bold">9:00 PM WAT</span></span>
                </div>
              </div>
            </div>
          </div>

          {/* Checklist Area */}
          <div className="bg-card/50 border border-border rounded-3xl p-8 sm:p-10">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-3 text-foreground">
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
                <div key={step.id} className="group flex items-start gap-6 p-6 hover:bg-card border border-transparent hover:border-border rounded-2xl transition-all">
                  <div className="text-yellow-500/50 font-bold text-lg mt-1 pr-2">{step.id}</div>
                  <div className="flex-1">
                    <h4 className="font-bold text-foreground mb-2 group-hover:text-yellow-500 transition-colors uppercase tracking-tight">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-xl">{step.desc}</p>
                    {step.subActions && (
                      <div className="flex gap-4 mt-4">
                        {step.subActions.map((sub, idx) => (
                          <Link key={idx} href={sub.link} target="_blank" className="px-3 py-1 bg-background border border-border rounded text-[10px] font-bold text-muted-foreground hover:text-yellow-500 hover:border-yellow-500/30 transition-all uppercase tracking-widest">
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                  {!step.subActions && (
                    <Link href={step.link} className="flex items-center gap-2 text-[10px] text-muted-foreground group-hover:text-yellow-500 transition-all font-bold tracking-widest uppercase">
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
            <div className="absolute top-0 right-0 p-4 opacity-10 text-yellow-500">
              <Calendar className="w-16 h-16" />
            </div>
            <h4 className="font-bold text-yellow-500 mb-6 tracking-tight uppercase text-xs">Module Roadmap Snapshot</h4>
            <div className="space-y-4 relative z-10">
              {weeks.slice(0, 5).map((week) => {
                const publishedSessions = week.sessions || [];
                const hasLive = publishedSessions.some(s => s.status === 'live');
                const allArchived = publishedSessions.length > 0 && publishedSessions.every(s => s.status === 'archived');
                const status = publishedSessions.length === 0 ? 'locked' : (hasLive ? 'live' : (allArchived ? 'archived' : 'scheduled'));
                
                return (
                  <div key={week.id} className="flex items-center justify-between text-sm">
                    <span className="text-foreground font-semibold tracking-tight">Week {week.week_number}: {week.title.split(' ').slice(0, 2).join(' ')}...</span>
                    <Badge status={status} />
                  </div>
                );
              })}
              <div className="pt-4 border-t border-border mt-4">
                <p className="text-[10px] text-muted-foreground/60 leading-relaxed uppercase font-bold tracking-widest">
                  The roadmap is live. Modules unlock as we progress through the 12-week deployment cycle.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-3xl p-8">
            <h4 className="font-bold text-muted-foreground/60 mb-6 tracking-tight uppercase text-xs">Support Terminal</h4>
            <p className="text-sm text-muted-foreground/70 mb-6 leading-relaxed">Logged issues or technical deployment blockers? Hit the academy support bridge for immediate triage.</p>
            <button className="w-full py-3 bg-background border border-border rounded-lg text-foreground text-[10px] font-bold tracking-widest hover:border-yellow-500/30 hover:text-yellow-500 transition-all uppercase">
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
    locked: "text-muted-foreground/60",
    "pre-flight": "text-amber-500/80",
    live: "text-emerald-500 animate-pulse font-bold",
    archived: "text-sky-500/80"
  };
  return <span className={`text-[10px] uppercase font-bold tracking-widest ${styles[status] || "text-muted-foreground/60"}`}>{status}</span>;
}
