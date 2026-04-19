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
    <div className="bg-background text-foreground min-h-screen font-sans antialiased selection:bg-yellow-500/30 selection:text-yellow-200 transition-colors duration-300">

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
        <div className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-yellow-500/20 bg-yellow-500/5 text-yellow-500 dark:text-yellow-400 text-[11px] font-bold uppercase tracking-[0.2em] mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 dark:bg-yellow-400 animate-pulse" />
          Cohort 1 · Now Enrolling · Starting April 2026
        </div>

        {/* Headline */}
        <h1 className="relative z-10 max-w-4xl text-4xl sm:text-5xl lg:text-7xl font-black tracking-tight leading-[0.95] mb-6">
          <span className="text-foreground">Master the Cloud.</span>
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-yellow-400 to-amber-500 dark:from-yellow-400 dark:via-yellow-300 dark:to-amber-400">
            Command Your Career.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="relative z-10 max-w-2xl text-lg sm:text-xl text-muted-foreground leading-relaxed mb-12">
          A rigorous, <span className="text-yellow-600 dark:text-yellow-400 font-bold">16-week</span> immersive mentorship in Cloud Native Engineering.{" "}
          <span className="">Zero tech background required</span>
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
            className="inline-flex items-center gap-2 px-6 py-4 text-muted-foreground hover:text-yellow-500 dark:hover:text-yellow-400 text-sm font-bold uppercase tracking-widest transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            Browse Free Labs
          </Link>
        </div>

        {/* Stat strip */}
        <div className="relative z-10 mt-20 flex flex-wrap justify-center gap-10 border-t border-border/50 pt-10">
          {[
            { value: "16", label: "Weeks Intensity" },
            { value: "32+", label: "Live Sessions" },
            { value: "₦250k", label: "Full Investment" },
            { value: "100%", label: "Hands-On Labs" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl font-black text-yellow-600 dark:text-yellow-400 font-mono">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground/40 text-[10px] font-bold uppercase tracking-widest">
          <span>Scroll</span>
          <div className="w-px h-8 bg-gradient-to-b from-muted-foreground/40 to-transparent" />
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* 2. MISSION & METHODOLOGY                        */}
      {/* ──────────────────────────────────────────────── */}
      <section className="relative py-32 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/40 to-background pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          {/* Section label */}
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-6">
            Our Philosophy
          </p>

          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-8 max-w-3xl">
            We don&apos;t do{" "}
            <span className="relative">
              <span className="text-muted-foreground/30 dark:text-muted-foreground/60 line-through decoration-red-500/60">passive video courses.</span>
            </span>
          </h2>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
              <p>
                Kybern Academy is a{" "}
                <span className="text-foreground font-semibold">simulation of a real enterprise engineering environment.</span>
                {" "}From day one, you operate like a professional — provisioning live infrastructure, debugging production failures, and communicating architectural decisions in writing.
              </p>
              <p>
                Every session is recorded and instantly archived in your private student dashboard. This allows for infinite revision of complex architectural discussions while maintaining the high-accountability, live-first culture required to develop the{" "}
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">instincts that senior engineers pay for.</span>
              </p>
            </div>

            <div className="space-y-4">
              {[
                { icon: <Zap className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />, title: "The High-Frequency Schedule", desc: "Thu/Fri 9-11 PM (Core). Sat 10 AM-12 PM (Q&A). All sessions recorded & deployed instantly." },
                { icon: <Users className="w-5 h-5 text-cyan-500 dark:text-cyan-400" />, title: "Direct Instructor Access", desc: "Every student gets direct access to Lead Engineers. We prioritize quality oversight and personalized feedback for every participant." },
                { icon: <Server className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />, title: "You Run Real Infra", desc: "Your AWS and GCP accounts. Your Terraform state. Your Kubernetes cluster. Real costs, real stakes." },
              ].map(({ icon, title, desc }) => (
                  <div key={title} className="flex gap-4 p-5 bg-card/60 border border-border rounded-2xl hover:border-yellow-500/20 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                      {icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground mb-1">{title}</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
                yellow: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500 dark:text-yellow-400",
                cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400",
                emerald: "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400",
              };
              const topBarMap: Record<string, string> = {
                yellow: "from-yellow-500 to-yellow-300",
                cyan: "from-cyan-500 to-cyan-300",
                emerald: "from-emerald-500 to-emerald-300",
              };
              return (
                <div
                  key={badge}
                  className={`relative bg-card/60 border rounded-3xl p-8 flex flex-col gap-6 transition-all duration-300 ${accentMap[accent]}`}
                >
                  {/* Top accent line */}
                  <div className={`absolute top-0 left-8 right-8 h-px bg-gradient-to-r ${topBarMap[accent]}`} />

                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                      {icon}
                    </div>
                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-full border ${badgeMap[accent]}`}>
                      {badge}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-foreground mb-3 leading-snug">{title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
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
      <section className="py-20 px-6 bg-muted/20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">The 16-Week Roadmap</p>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Two Phases. Zero Compromise.</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-8 mt-6">
              <div className="text-xs text-muted-foreground/60 flex items-center gap-2">
                <span className="text-yellow-600 dark:text-yellow-400 font-bold">Phase 1:</span> 12 Weeks Training
              </div>
              <div className="text-xs text-muted-foreground/60 flex items-center gap-2">
                <span className="text-cyan-600 dark:text-cyan-400 font-bold">Phase 2:</span> 4 Weeks Capstone
              </div>
            </div>
            
            {/* Recording Note */}
            <div className="inline-flex items-center gap-2 mt-8 px-4 py-1 rounded-full bg-muted/50 border border-border text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
              <MonitorPlay className="w-3 h-3 text-yellow-500" />
              All live sessions recorded & instantly deployed to dashboard
            </div>
          </div>
          <div className="space-y-3">
            {curriculum.map(({ week, title, tag }) => (
              <div
                key={week}
                className="flex flex-wrap sm:flex-nowrap items-center gap-3 sm:gap-5 p-4 sm:p-5 bg-card/60 border border-border rounded-2xl hover:border-yellow-500/20 hover:bg-yellow-500/[0.02] transition-all group"
              >
                <span className="w-16 sm:w-20 text-[9px] sm:text-[10px] font-black text-muted-foreground/40 font-mono tracking-widest flex-shrink-0 uppercase">{week}</span>
                <ChevronRight className="hidden sm:block w-4 h-4 text-muted-foreground group-hover:text-yellow-500/50 transition-colors flex-shrink-0" />
                <span className="flex-1 min-w-[140px] font-bold text-foreground/80 group-hover:text-foreground transition-colors">{title}</span>
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] px-2 py-1 bg-muted rounded-full text-muted-foreground/60 flex-shrink-0 ml-auto sm:ml-0">{tag}</span>
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
            
            <div className="relative bg-card border border-yellow-500/30 rounded-3xl p-10 md:p-16 overflow-hidden">
               {/* Decorative background text */}
               <div className="absolute top-0 right-0 text-[120px] font-black text-yellow-500/5 select-none pointer-events-none -translate-y-10 translate-x-10">
                 TOP 3
               </div>

               <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                 <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center flex-shrink-0">
                   <Trophy className="w-10 h-10 text-yellow-500" />
                 </div>
                 
                 <div className="text-center md:text-left">
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500 dark:text-yellow-400 mb-4">The Incentive Program</p>
                   <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-6">The Elite Track: Top 3 Guarantee</h2>
                   <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
                     Kybern Academy is a proving ground. The <span className="text-yellow-600 dark:text-yellow-400 font-bold underline decoration-yellow-500/30 underline-offset-4">top 3 performing students</span> will be drafted to work directly alongside our Lead DevOps Engineer on a live production project, and fast-tracked for direct internship placements within our corporate network.
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-400 dark:to-amber-300">
                  this for?
                </span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed">
                Kybern Academy Training is designed for{" "}
                <span className="text-foreground font-semibold">ambitious people who are willing to work hard, not passive learners </span>
                looking for structured entertainment. The only admissions criterion that truly matters is{" "}
                <span className="text-yellow-600 dark:text-yellow-400 font-semibold">grit.</span>
              </p>
            </div>

            <div className="space-y-3">
              {requirements.map(({ ok, text }) => (
                <div
                  key={text}
                  className={`flex items-start gap-4 p-4 rounded-xl border transition-colors ${
                    ok
                      ? "bg-emerald-500/5 border-emerald-500/15"
                      : "bg-card/60 border-border"
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {ok ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground/30" />
                    )}
                  </div>
                  <p className={`text-sm leading-relaxed ${ok ? "text-emerald-700 dark:text-emerald-300" : "text-muted-foreground"}`}>
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
      <section id="apply" className="py-32 px-6 bg-muted/20 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-yellow-500/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">Transparent Pricing</p>
            <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">
              The Investment:{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-amber-600 dark:from-yellow-400 dark:to-amber-300">₦250,000</span>
            </h2>
            <p className="text-muted-foreground/60 max-w-xl mx-auto text-base leading-relaxed">
              This is not a subscription. It is a single, high-stakes investment in one of the highest-demand skills in the global job market.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">

            {/* Option 1: Pay in Full */}
            <div className="relative bg-card border border-yellow-500/30 rounded-3xl p-8 flex flex-col gap-6 overflow-hidden group hover:border-yellow-500/50 hover:shadow-[0_0_50px_rgba(234,179,8,0.08)] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-amber-400" />

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-600 dark:text-yellow-500/70 bg-yellow-500/10 px-3 py-1 rounded-full border border-yellow-500/20">
                  Pay in Full
                </span>
                <p className="text-4xl font-black text-yellow-600 dark:text-yellow-400 font-mono mt-4">₦250,000</p>
                <p className="text-muted-foreground/60 text-sm mt-2 font-bold uppercase tracking-widest">One payment. Zero obligations.</p>
              </div>

              <ul className="space-y-3 flex-1">
                {[
                  "Complete access to the 16-week program",
                  "Live recordings instantly available-on-demand",
                  "Priority enrollment confirmation",
                  "Lifetime alumni network access",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
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
            <div className="relative bg-card border border-cyan-500/25 rounded-3xl p-8 flex flex-col gap-6 overflow-hidden group hover:border-cyan-500/40 hover:shadow-[0_0_50px_rgba(6,182,212,0.05)] transition-all">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-cyan-500 to-cyan-300" />

              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400/70 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                  Kybern Flexible Ledger
                </span>
                <p className="text-4xl font-black text-cyan-600 dark:text-cyan-300 font-mono mt-4">₦100,000</p>
                <p className="text-muted-foreground/60 text-sm mt-2 font-bold uppercase tracking-widest">Initial deposit for program admission.</p>
              </div>

              <ul className="space-y-3 flex-1">
                {[
                  "Confirm your enrollment immediately",
                  "Full portal & recording access from day one",
                  "Pay remaining ₦150k over installments",
                  "4-Week Advanced Capstone Phase included",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-cyan-500 dark:text-cyan-400 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
                <li className="flex items-start gap-3 text-[11px] text-muted-foreground/40 pt-2 border-t border-border">
                  <ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/30 flex-shrink-0 mt-0.5" />
                  Missed payments trigger automated account suspension. No exceptions.
                </li>
              </ul>

              <Link
                href="/academy/register"
                className="w-full text-center py-3.5 px-6 bg-cyan-600/10 dark:bg-cyan-500/10 hover:bg-cyan-600/20 dark:hover:bg-cyan-500/20 border border-cyan-600/30 dark:border-cyan-500/30 hover:border-cyan-600 dark:hover:border-cyan-400/50 text-cyan-700 dark:text-cyan-300 font-black text-xs uppercase tracking-widest rounded-xl transition-all active:scale-[0.99]"
              >
                Apply & Pay Deposit →
              </Link>
            </div>
          </div>

          {/* Instalment footnote */}
          <p className="text-center text-[11px] text-muted-foreground/40 mt-8 max-w-lg mx-auto leading-relaxed uppercase font-black tracking-widest">
            All payments are processed securely via Paystack. Your billing status is tracked in real-time through the Kybern student portal.
          </p>
        </div>
      </section>

      {/* ──────────────────────────────────────────────── */}
      {/* APPLICATION FORM ANCHOR                         */}
      {/* ──────────────────────────────────────────────── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-4">Final Admission Pass</p>
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-6">
            Ready to commit?
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed mb-12 text-muted-foreground/60 font-bold uppercase tracking-widest">
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
      <footer className="relative border-t border-border/50 py-24 px-6 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 dark:opacity-100" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-yellow-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-yellow-500/60 mb-6 font-black uppercase tracking-[0.3em]">
            ⚡ Enrollment Open
          </p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight mb-6">
            Admission for Cohort 1 is<br />
            <span className="text-muted-foreground/30">curated to ensure</span>{" "}
            <span className="text-yellow-500 dark:text-yellow-400">high-quality mentorship.</span>
          </h2>
          <p className="text-muted-foreground text-lg mb-12 max-w-xl mx-auto leading-relaxed">
            Join a community of high-performing engineers. Our roadmap is designed for those ready to master live infrastructure and professional DevOps workflows.
          </p>

          <Link
            href="/academy/register"
            className="group inline-flex items-center gap-4 px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black text-base uppercase tracking-widest rounded-2xl transition-all duration-200 shadow-[0_0_50px_rgba(234,179,8,0.4)] hover:shadow-[0_0_80px_rgba(234,179,8,0.6)] active:scale-[0.99]"
          >
            Confirm Enrollment
            <ArrowRight className="w-6 h-6 group-hover:translate-x-1.5 transition-transform" />
          </Link>

          {/* Trust signals */}
          <div className="flex flex-wrap justify-center gap-8 mt-16 pt-10 border-t border-border text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">
            <span className="flex items-center gap-2"><ShieldCheck className="w-3.5 h-3.5 text-muted-foreground/30" /> SSL Secured Payments</span>
            <span className="flex items-center gap-2"><Users className="w-3.5 h-3.5 text-muted-foreground/30" /> Direct Instructor Access</span>
            <span className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-muted-foreground/30" /> Live Engineering Sessions</span>
          </div>

          <p className="text-muted-foreground/30 text-[11px] mt-8 uppercase font-bold tracking-widest">
            © 2026 Kybern Academy · Cloud Native Mentorship Program ·{" "}
            <Link href="/academy/login" className="hover:text-muted-foreground transition-colors underline underline-offset-4 decoration-muted-foreground/20">Student Login</Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
