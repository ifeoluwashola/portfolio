import { Search, Compass, Cog, ArrowRightLeft } from "lucide-react";

export function EngagementProcess() {
  const steps = [
    {
      id: "01",
      title: "Discovery Call (Free, 45 minutes)",
      description: "We listen first. You walk us through your current setup, your pain points, and your goals. We ask the questions your last consultant didn't. By the end, we both know whether we're a fit.",
      icon: Search,
    },
    {
      id: "02",
      title: "Infrastructure Audit & Diagnosis",
      description: "We go deep into your current environment using strictly read-only access—zero risk to your production workloads. We map your architecture, identify the gaps, and quantify the cost in dollars, time, and risk. You get a full findings report before we recommend anything.",
      icon: Cog,
    },
    {
      id: "03",
      title: "Custom Architecture Design",
      description: "Based on what we found, we design a solution that fits your actual stage and budget. Not what works for a Series C company if you're Series A. The right tool for where you are now, built to grow with you.",
      icon: Compass,
    },
    {
      id: "04",
      title: "Phased Implementation",
      description: "We build in safe, incremental phases with zero downtime. Each phase is reviewed, tested, and documented before we move to the next. No big-bang releases. No surprises.",
      icon: Cog,
    },
    {
      id: "05",
      title: "Handoff & Team Enablement",
      description: "We leave you with complete documentation, runbooks, and a team that knows how to operate what we built. We also run a knowledge transfer session so your engineers are confident — not dependent on us.",
      icon: ArrowRightLeft,
    }
  ];

  return (
    <section id="methodology" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-kn-accent/5 via-kn-bg to-kn-bg"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:text-center mb-16 sm:mb-24">
          <h2 className="text-base font-semibold leading-7 text-kn-accent tracking-widest uppercase">HOW WE WORK</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl">
            We don&apos;t show up with a predetermined solution. We diagnose before we prescribe.
          </p>
          <p className="mt-6 text-lg leading-8 text-kn-muted">
            Here&apos;s what working with us looks like, from first call to final handoff.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 xl:gap-8 relative">
          {/* Horizontal line connecting steps (hidden on md and below) */}
          <div className="hidden lg:block absolute top-14 left-[10%] right-[10%] h-px bg-kn-border z-0"></div>
          
          {steps.map((step) => (
            <div key={step.id} className="relative flex flex-col group pt-8 lg:pt-0">
              
              {/* Icon Node */}
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-kn-border bg-kn-card shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 mx-auto lg:mb-8 group-hover:scale-110 group-hover:border-kn-accent/50 transition-all duration-300">
                <step.icon className="h-5 w-5 text-kn-accent" aria-hidden="true" />
              </div>

              {/* Content Box */}
              <div className="flex flex-col flex-grow bg-kn-card p-6 rounded-2xl border border-kn-border group-hover:border-kn-accent/50 shadow-lg transition-all text-center mt-6 lg:mt-0">
                <span className="text-3xl font-black opacity-20 text-kn-accent mb-2 tracking-tighter">{step.id}.</span>
                <h3 className="text-lg font-bold text-kn-heading mb-3">{step.title}</h3>
                <p className="text-sm text-kn-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
