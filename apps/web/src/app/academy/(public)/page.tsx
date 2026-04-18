import Link from "next/link";
import {
  ArrowRight,
  Terminal,
  GitPullRequest,
  Trophy,
  CheckCircle2,
  Zap,
  Users,
  Lock,
  Server,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  MonitorPlay,
} from "lucide-react";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: <Terminal className="w-6 h-6 text-yellow-400" />,
    badge: "Break-It Labs",
    title: "Fix Broken Production Infrastructure",
    desc: "Every week you're dropped into a live honeypot environment with deliberately broken servers, misconfigured clusters, and failing pipelines. Your job: find the fault, fix it, document it. Real engineers learn by breaking things — we just make it safe.",
    accent: "yellow",
  },
  {
    icon: <GitPullRequest className="w-6 h-6 text-cyan-400" />,
    badge: "Peer-Reviewed Architecture",
    title: "Submit Code Like a Lead Engineer",
    desc: "Your weekly infrastructure deliverables are submitted as Pull Requests and reviewed by senior engineers with inline annotations. You'll learn to read reviews, address feedback, and defend architectural decisions — the same workflow used at FAANG.",
    accent: "cyan",
  },
  {
    icon: <Trophy className="w-6 h-6 text-emerald-400" />,
    badge: "Capstone Portfolio",
    title: "Graduate With a Verified Portfolio",
    desc: "On completion, your full 16-week infrastructure portfolio is deployed to a live, public Kybern subdomain. Recruiters can inspect your actual Terraform modules, Kubernetes manifests, and CI/CD pipelines — not a résumé bullet, but a live artefact.",
    accent: "emerald",
  },
];

const curriculum = [
  { week: "Wk 1–2", title: "Linux & Git Foundations", tag: "Core" },
  { week: "Wk 3–4", title: "Docker & Containerisation", tag: "Core" },
  { week: "Wk 5–6", title: "CI/CD with GitHub Actions", tag: "Core" },
  { week: "Wk 7–8", title: "Infrastructure as Code (Terraform)", tag: "IaC" },
  { week: "Wk 9–10", title: "Kubernetes Orchestration", tag: "Orchestration" },
  { week: "Wk 11–12", title: "Observability & DevSecOps", tag: "Core" },
  { week: "Wk 13–16", title: "Capstone Phase: Prod Migration", tag: "Capstone" },
];

const requirements = [
  { ok: true, text: "No prior programming experience required" },
  { ok: true, text: "No prior cloud or DevOps background needed" },
  { ok: true, text: "Absolute beginners are explicitly welcome" },
  { ok: false, text: "You must own a working laptop (min. 8 GB RAM, Linux-compatible)" },
  { ok: false, text: "Strong general computer literacy is non-negotiable" },
  { ok: false, text: "Available Thu/Fri 9-11 PM & Sat 10 AM-12 PM WAT" },
  { ok: false, text: "You must commit 10+ hours per week outside class hours" },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AcademyLandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans antialiased selection:bg-yellow-500/30 selection:text-yellow-200">

      {/* ──────────────────────────────────────────────── */}
      {/* 1. HERO                                         */}
      {/* ──────────────────────────────────────────────── */}
      <section className="relative min-h-[92vh] flex flex-col items-center justify-center text-center overflow-hidden px-6">

        {/* Grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

        {/* Yellow glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[400px] bg-yellow-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Eyebrow */}
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          Cohort 1 · Now Enrolling · Starting April 2026
        </div>

        {/* Headline */}
        <h1 className="relative z-10 max-w-4xl text-5xl sm:text-6xl lg:text-8xl font-black tracking-tight leading-[0.95] mb-6">
          <span className="text-slate-100">Master the Cloud.</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-300 to-amber-400">
            Command Your Career.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 max-w-2xl text-lg sm:text-xl text-slate-400 leading-relaxed mb-12">
          A rigorous, <span className="text-yellow-400 font-bold">16-week</span> immersive mentorship in Cloud Native Engineering.{" "}
          <span className="text-slate-200 font-semibold">Zero tech background required</span>
          {" "}— just absolute dedication.
        </p>

        {/* CTAs */}
        <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/academy/register"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl transition-all duration-200 shadow-[0_0_30px_rgba(234,179,8,0.35)] hover:shadow-[0_0_50px_rgba(234,179,8,0.5)] active:scale-[0.98]"
          >
            Apply for Cohort 1
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            href="/academy/break-it-labs"
            className="inline-flex items-center gap-2 px-6 py-4 text-slate-400 hover:text-yellow-400 text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Browse Free Labs
          </Link>
        </div>

        {/* Stat strip */}
        <div className="relative z-10 mt-20 flex flex-wrap justify-center gap-10 border-t border-slate-800/60 pt-10">
          {[
            { value: "16", label: "Weeks Intensity" },
            { value: "32+", label: "Live Sessions" },
            { value: "₦250k", label: "Full Investment" },
            { value: "100%", label: "Hands-On Labs" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-yellow-400 font-mono">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-700 text-[10px] font-bold uppercase tracking-widest">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-slate-700 to-transparent" />
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 2. MISSION & METHODOLOGY                        */}
      {/* ──────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-900/40 to-slate-950 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Section label */}
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-6">
            Our Philosophy
          </p>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-8 max-w-3xl">
            We don&apos;t do{" "}
            <span className="relative">
              <span className="text-slate-600 line-through decoration-red-500/60">passive video courses.</span>
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-slate-400 text-lg leading-relaxed">
              <p>
                Kybern Academy is a{" "}
                <span className="text-slate-100 font-semibold">simulation of a real enterprise engineering environment.</span>
                {" "}From day one, you operate like a professional — provisioning live infrastructure, debugging production failures, and communicating architectural decisions in writing.
              </p>
              <p>
                There are no lecture recordings to catch up on. If you miss a live session, you fall behind — by design. This is how real engineering teams operate, and it is precisely how you develop the{" "}
                <span className="text-yellow-400 font-semibold">instincts that employers pay for.</span>
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Zap className="w-5 h-5 text-yellow-400" />, title: "The High-Frequency Schedule", desc: "Thu/Fri 9-11 PM (Core). Sat 10 AM-12 PM (Q&A). All sessions recorded & deployed instantly." },
                { icon: <Users className="w-5 h-5 text-cyan-400" />, title: "Cohort-Capped at 20", desc: "Every student gets direct access to Lead Engineers. We deliberately reject scale for quality." },
                { icon: <Server className="w-5 h-5 text-emerald-400" />, title: "You Run Real Infra", desc: "Your AWS and GCP accounts. Your Terraform state. Your Kubernetes cluster. Real costs, real stakes." },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="flex gap-4 p-5 bg-slate-900/60 border border-slate-800/60 rounded-2xl hover:border-slate-700/60 transition-colors">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center flex-shrink-0">
                    {icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 mb-1">{title}</h4>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 3. PLATFORM ADVANTAGE                           */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">
              The Kybern Edge
            </p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight max-w-2xl mx-auto">
              Three systems that make the difference.
            </h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {features.map(({ icon, badge, title, desc, accent }) => {
              const accentMap: Record<string, string> = {
                yellow: "border-yellow-500/20 hover:border-yellow-500/40 hover:shadow-[0_0_40px_rgba(234,179,8,0.06)]",
                cyan: "border-cyan-500/20 hover:border-cyan-500/40 hover:shadow-[0_0_40px_rgba(6,182,212,0.06)]",
                emerald: "border-emerald-500/20 hover:border-emerald-500/40 hover:shadow-[0_0_40px_rgba(16,185,129,0.06)]",
              };
              const badgeMap: Record<string, string> = {
                yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-400",
                cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
                emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
              };
              const topBarMap: Record<string, string> = {
                yellow: "from-yellow-500 to-yellow-300",
                cyan: "from-cyan-500 to-cyan-300",
                emerald: "from-emerald-500 to-emerald-300",
              };
              return (
                <div
                  key={badge}
                  className={`relative bg-slate-900/60 border rounded-3xl p-8 flex flex-col gap-6 transition-all duration-300 ${accentMap[accent]}`}
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${topBarMap[accent]}`} />

                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center">
                      {icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${badgeMap[accent]}`}>
                      {badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-100 mb-3 leading-snug">{title}</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 3b. CURRICULUM TIMELINE                         */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-20 px-6 bg-slate-900/30">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">The 16-Week Roadmap</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Two Phases. Zero Compromise.</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mt-6">
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="text-yellow-400 font-bold">Phase 1:</span> 12 Weeks Training
              </div>
              <div className="text-xs text-slate-500 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">Phase 2:</span> 4 Weeks Capstone
              </div>
            </div>
            
            {/* Recording Note */}
            <div className="inline-flex items-center gap-2 mt-8 px-4 py-1 rounded-full bg-slate-800/50 border border-slate-700/50 text-[10px] text-slate-500 uppercase font-bold tracking-widest">
              <MonitorPlay className="w-3 h-3 text-yellow-500" />
              All live sessions recorded & instantly deployed to dashboard
            </div>
          </div>
          <div className="space-y-3">
            {curriculum.map(({ week, title, tag }) => (
              <div
                key={week}
                className="flex items-center gap-5 p-5 bg-slate-900/60 border border-slate-800/50 rounded-2xl hover:border-yellow-500/20 hover:bg-yellow-500/[0.02] transition-all group"
              >
                <span className="w-20 text-[10px] font-black text-slate-600 font-mono tracking-widest flex-shrink-0 uppercase">{week}</span>
                <ChevronRight className="w-4 h-4 text-slate-700 group-hover:text-yellow-500/50 transition-colors flex-shrink-0" />
                <span className="flex-1 font-bold text-slate-300 group-hover:text-slate-100 transition-colors">{title}</span>
                <span className="text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 bg-slate-800 rounded-full text-slate-500 flex-shrink-0">{tag}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* ELITE TRACK SECTION                             */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="relative group">
            {/* Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
            
            <div className="relative bg-slate-900 border border-yellow-500/30 rounded-3xl p-10 md:p-16 overflow-hidden">
               {/* Decorative background text */}
               <div className="absolute top-0 right-0 text-[120px] font-black text-yellow-500/5 select-none pointer-events-none -translate-y-10 translate-x-10">
                 TOP 3
               </div>

               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                   <Trophy className="w-10 h-10 text-yellow-500" />
                 </div>
                 
                 <div className="text-center md:text-left">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-400 mb-4">The Incentive Program</p>
                   <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">The Elite Track: Top 3 Guarantee</h2>
                   <p className="text-slate-400 text-lg leading-relaxed max-w-2xl">
                     Kybern Academy is a proving ground. The <span className="text-yellow-400 font-bold underline decoration-yellow-500/30 underline-offset-4">top 3 performing students</span> will be drafted to work directly alongside our Lead DevOps Engineer on a live production project, and fast-tracked for direct internship placements within our corporate network.
                   </p>
                 </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 4. PREREQUISITES / THE VIBE CHECK               */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-6">The Vibe Check</p>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight mb-6">
                Who is{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
                  this for?
                </span>
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Kybern is designed for{" "}
                <span className="text-slate-200 font-semibold">ambitious people who are willing to work hard, not passive learners </span>
                looking for structured entertainment. The only admissions criterion that truly matters is{" "}
                <span className="text-yellow-400 font-semibold">grit.</span>
              </p>
            </div>

            <div className="space-y-3">
              {requirements.map(({ ok, text }) => (
                <div
                  key={text}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    ok
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : "bg-slate-900/60 border-slate-800/60"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-slate-500" />
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${ok ? "text-emerald-300" : "text-slate-400"}`}>
                    {ok ? <span className="font-semibold">✓ </span> : null}
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 5. TUITION & FLEXIBLE BILLING                   */}
      {/* ──────────────────────────────────────────────── */}
      <section id="apply" className="py-32 px-6 bg-slate-900/30 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">Transparent Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              The Investment:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">₦250,000</span>
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto text-base leading-relaxed">
              This is not a subscription. It is a single, high-stakes investment in one of the highest-demand skills in the global job market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Option 1: Pay in Full */}
            <div className="relative bg-slate-900 border border-yellow-500/30 rounded-3xl p-8 flex flex-col gap-6 overflow-hidden group hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(234,179,8,0.08)] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400" />

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/70 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  Pay in Full
                </span>
                <p className="text-4xl font-black text-yellow-400 font-mono mt-4">₦250,000</p>
                <p className="text-slate-500 text-sm mt-2">One payment. Zero obligations.</p>
              </div>

              <ul className="space-y-3 flex-1">
                {[
                  "Complete access to the 16-week program",
                  "Live recordings instantly available-on-demand",
                  "Priority cohort seat confirmation",
                  "Lifetime alumni network access",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/academy/register"
                className="w-full text-center py-3.5 px-6 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] active:scale-[0.99]"
              >
                Apply & Pay in Full →
              </Link>
            </div>

            {/* Option 2: Flexible Ledger */}
            <div className="relative bg-slate-900 border border-cyan-500/25 rounded-3xl p-8 flex flex-col gap-6 overflow-hidden group hover:border-cyan-500/40 hover:shadow-[0_0_50px_rgba(6,182,212,0.05)] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-300" />

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400/70 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  Kybern Flexible Ledger
                </span>
                <p className="text-4xl font-black text-cyan-300 font-mono mt-4">₦100,000</p>
                <p className="text-slate-500 text-sm mt-2">Initial deposit to secure your seat.</p>
              </div>

              <ul className="space-y-3 flex-1">
                {[
                  "Secure your cohort seat immediately",
                  "Full portal & recording access from day one",
                  "Pay remaining ₦150k over installments",
                  "4-Week Advanced Capstone Phase included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-400">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-[11px] text-slate-600 pt-2 border-t border-slate-800">
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-700 flex-shrink-0 mt-0.5" />
                  Missed payments trigger automated account suspension. No exceptions.
                </li>
              </ul>

              <Link
                href="/academy/register"
                className="w-full text-center py-3.5 px-6 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-400/50 text-cyan-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.99]"
              >
                Apply & Pay Deposit →
              </Link>
            </div>
          </div>

          {/* Instalment footnote */}
          <p className="text-center text-[11px] text-slate-600 mt-8 max-w-lg mx-auto leading-relaxed">
            All payments are processed securely via Paystack. Your billing status is tracked in real-time through the Kybern student portal.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* APPLICATION FORM ANCHOR                         */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-slate-800/20">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">Final Admission Pass</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Ready to commit?
          </h2>
          <p className="text-slate-400 text-lg leading-relaxed mb-12">
            The next cohort cycle begins shortly. Approved applicants proceed directly to payment — there is no waiting list for accepted students.
          </p>
          <Link
            href="/academy/register"
            className="group inline-flex items-center gap-3 px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-sm uppercase tracking-widest rounded-xl transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.5)] active:scale-[0.98]"
          >
            Go to Admission Form
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 6. FOOTER CTA                                   */}
      {/* ──────────────────────────────────────────────── */}
      <footer className="relative border-t border-slate-800/60 py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px]" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-yellow-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-6">
            ⚡ Limited Enrollment
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Seats for Cohort 1 are strictly<br />
            <span className="text-slate-600">limited to ensure</span>{" "}
            <span className="text-yellow-400">high-quality mentorship.</span>
          </h2>
          <p className="text-slate-500 text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            We cap every cohort at 20 engineers. When the seats are gone, they are gone. The next opening is Cohort 2 — with no confirmed date yet.
          </p>

          <Link
            href="/academy/register"
            className="group inline-flex items-center gap-4 px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-base uppercase tracking-widest rounded-2xl transition-all duration-200 shadow-[0_0_50px_rgba(234,179,8,0.4)] hover:shadow-[0_0_80px_rgba(234,179,8,0.6)] active:scale-[0.99]"
          >
            Secure Your Seat
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-10 border-t border-slate-800/40 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-slate-700" /> SSL Secured Payments</span>
            <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-slate-700" /> Max 20 Students / Cohort</span>
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-slate-700" /> Live Engineering Sessions</span>
          </div>

          <p className="text-slate-700 text-[11px] mt-8">
            © 2026 Kybern Academy · Cloud Native Mentorship Program ·{" "}
            <Link href="/academy/login" className="hover:text-slate-500 transition-colors">Student Login</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
