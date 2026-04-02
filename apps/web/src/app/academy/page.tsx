import { CountdownTimer } from "@/components/CountdownTimer";
import { AcademyRegistrationForm } from "@/components/AcademyRegistrationForm";
import { Clock, Laptop, Wallet, BookOpen, ChevronRight, Container, Server, Shield, Cloud } from "lucide-react";
import Link from "next/link";

export default function AcademyCohortPage() {
  const curriculum = [
    {
      weeks: "Weeks 1-2",
      title: "Linux & Git Foundations",
      icon: <Terminal className="w-5 h-5" />,
      desc: "Master the command line, permissions, process management, and advanced version control.",
    },
    {
      weeks: "Weeks 3-4",
      title: "Docker & Containerization",
      icon: <Container className="w-5 h-5" />,
      desc: "Containerize applications, manage volumes, network bridges, and craft optimized Dockerfiles.",
    },
    {
      weeks: "Weeks 5-6",
      title: "CI/CD Pipelines (GitHub Actions)",
      icon: <GitBranch className="w-5 h-5" />,
      desc: "Automate testing, linting, and deployments with robust CI/CD workflow strategies.",
    },
    {
      weeks: "Weeks 7-8",
      title: "Infrastructure as Code (Terraform)",
      icon: <Cloud className="w-5 h-5" />,
      desc: "Provision AWS/GCP infrastructure programmatically with advanced state management.",
    },
    {
      weeks: "Weeks 9-10",
      title: "Container Orchestration (Kubernetes)",
      icon: <Server className="w-5 h-5" />,
      desc: "Deploy, scale, and manage resilient clusters using Deployments, Services, and Ingress.",
    },
    {
      weeks: "Weeks 11-12",
      title: "Capstone: The Enterprise Pipeline",
      icon: <Shield className="w-5 h-5" />,
      desc: "A full GitOps deployment integrating everything you've learned into a single enterprise-grade project.",
    },
  ];

  return (
    <div className="bg-background min-h-screen relative font-sans text-foreground">
      {/* Background Developer Motif */}
      <div className="absolute inset-x-0 top-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Top Gradient Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] opacity-20 pointer-events-none blur-[100px] bg-yellow-500/30 rounded-full" />

      {/* Navigation Ecosystem Link */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-12">
        <Link href="/academy/materials" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-yellow-400 transition-colors">
          <BookOpen className="w-4 h-4 mr-2" />
          Browse free prerequisite materials
          <ChevronRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-20 pb-32">
        {/* Hero Section */}
        <section className="text-center max-w-4xl mx-auto mb-24 relative z-10">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-7xl mb-6 text-transparent bg-clip-text bg-gradient-to-br from-white via-slate-200 to-slate-500">
            Break into<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-sky-400 drop-shadow-sm">Cloud Engineering.</span>
          </h1>
          <p className="mt-6 text-xl leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            A rigorous 12-week live DevOps mentorship program. Master Linux, Docker, Terraform, and Kubernetes.
          </p>
          
          <CountdownTimer />
        </section>

        {/* Logistics Grid */}
        <section className="mb-32">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-card/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-lg border-t-emerald-500/30 transition-all hover:bg-card/60">
              <Clock className="w-8 h-8 text-yellow-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Intense Schedule</h3>
              <p className="text-muted-foreground leading-relaxed">
                Thursdays and Fridays<br/>
                (9:00 PM - 11:00 PM WAT).<br/>
                No recordings provided. Live only.
              </p>
            </div>
            <div className="bg-card/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-lg border-t-emerald-500/30 transition-all hover:bg-card/60">
              <Laptop className="w-8 h-8 text-yellow-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Prerequisites</h3>
              <ul className="text-muted-foreground leading-relaxed text-sm space-y-2">
                <li className="flex items-start"><span className="mr-2 text-yellow-400">•</span>Basic computer knowledge & operations.</li>
                <li className="flex items-start"><span className="mr-2 text-yellow-400">•</span>Minimum 8GB RAM of Linux Compatible Computer.</li>
                <li className="flex items-start"><span className="mr-2 text-yellow-400">•</span>Create <a href="https://aws.amazon.com/free/" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline mx-1">AWS</a> & <a href="https://cloud.google.com/free" target="_blank" rel="noreferrer" className="text-yellow-400 hover:underline mx-1">GCP</a> Free Tier accounts.</li>
              </ul>
            </div>
            <div className="bg-card/40 backdrop-blur-md rounded-2xl p-8 border border-white/5 shadow-lg border-t-emerald-500/30 transition-all hover:bg-card/60">
              <Wallet className="w-8 h-8 text-yellow-400 mb-6" />
              <h3 className="text-xl font-bold mb-3">Commitment</h3>
              <p className="text-muted-foreground leading-relaxed">
                ₦10,000 Registration Fee.<br/>
                10+ hours a week required for classes, study, and labs.
              </p>
            </div>
          </div>
        </section>

        {/* Curriculum Timeline */}
        <section className="mb-32 max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4 tracking-tight">The 12-Week Curriculum</h2>
            <div className="w-24 h-1 bg-gradient-to-r from-yellow-500 to-sky-500 mx-auto rounded-full" />
          </div>
          
          <div className="space-y-6">
            {curriculum.map((item, index) => (
              <div key={index} className="flex flex-col sm:flex-row gap-6 bg-secondary/50 p-6 sm:p-8 rounded-2xl border border-border items-start group hover:border-yellow-500/30 transition-colors">
                <div className="flex flex-col items-center sm:w-32 flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center text-yellow-400 mb-3 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <span className="text-sm font-bold text-muted-foreground text-center font-mono">
                    {item.weeks}
                  </span>
                </div>
                <div className="flex-1 mt-1">
                  <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-yellow-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Form Container */}
        <section className="scroll-mt-24 pt-10" id="apply">
          <AcademyRegistrationForm />
        </section>
      </main>
    </div>
  );
}

// Ensure these missing icons are rendered without importing externally to avoid crashes if not in lucide-react currently
function Terminal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>
  )
}
function GitBranch(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/></svg>
  )
}
