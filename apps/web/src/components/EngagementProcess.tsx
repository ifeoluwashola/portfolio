import { Search, Compass, Cog, ArrowRightLeft } from "lucide-react";

export function EngagementProcess() {
  const steps = [
    {
      id: "01",
      title: "Discovery & Alignment",
      description: "Diagnose before we prescribe. We start by understanding your business objectives, current infrastructure, team capabilities, and budget constraints.",
      icon: Search,
    },
    {
      id: "02",
      title: "Tailored Architecture Design",
      description: "The right tool for the right stage. Whether you need lightweight serverless optimization or robust container orchestration, we design a custom blueprint that fits your specific runway.",
      icon: Compass,
    },
    {
      id: "03",
      title: "Phased Execution & Automation",
      description: "Zero-downtime implementation. We implement the architecture in safe, incremental phases, translating manual processes into reliable Infrastructure as Code.",
      icon: Cog,
    },
    {
      id: "04",
      title: "Handoff & Team Enablement",
      description: "We don't build black boxes. We deliver comprehensive documentation and actively upskill your internal team so they confidently own the new infrastructure.",
      icon: ArrowRightLeft,
    }
  ];

  return (
    <section id="methodology" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-kn-accent/5 via-kn-bg to-kn-bg"></div>
      
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:text-center mb-16 sm:mb-24">
          <h2 className="text-base font-semibold leading-7 text-kn-accent tracking-widest uppercase">How We Work</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl">
            Our Engagement Methodology: Engineered for Your Business
          </p>
          <p className="mt-6 text-lg leading-8 text-kn-muted">
            We tailor solutions to your budget and goals rather than forcing specific technologies. Here is our proven roadmap to scaling your systems securely.
          </p>
        </div>

        <div className="relative mx-auto max-w-5xl">
          {/* Vertical connecting line */}
          <div className="absolute left-8 top-8 bottom-8 w-px bg-kn-border md:left-1/2 md:-ml-px"></div>
          
          <div className="space-y-12 md:space-y-0">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;
              return (
                <div key={step.id} className={`relative flex flex-col md:flex-row items-center ${isEven ? 'md:flex-row-reverse' : ''} md:py-8`}>
                  
                  {/* Timeline Node */}
                  <div className="absolute left-8 md:left-1/2 flex h-12 w-12 -ml-6 items-center justify-center rounded-full border border-kn-border bg-kn-card shadow-[0_0_15px_rgba(0,0,0,0.1)] dark:shadow-[0_0_15px_rgba(0,0,0,0.5)] z-10 transition-transform duration-500 hover:scale-125">
                    <step.icon className="h-5 w-5 text-kn-accent" aria-hidden="true" />
                  </div>

                  {/* Content Box */}
                  <div className={`w-full md:w-1/2 pl-24 pr-0 md:px-16 py-4 ${isEven ? 'md:text-left' : 'md:text-right'}`}>
                    <div className={`relative group p-8 rounded-2xl bg-kn-card backdrop-blur-sm border border-kn-border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl`}>
                      <div className="absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl bg-kn-accent-bg"></div>
                      
                      <div className={`flex flex-col ${isEven ? 'md:items-start' : 'md:items-end'} items-start relative z-10`}>
                        <span className="text-5xl font-black opacity-20 text-kn-accent mb-4 tracking-tighter">{step.id}.</span>
                        <h3 className="text-xl font-bold text-kn-heading mb-3">{step.title}</h3>
                        <p className="text-kn-muted leading-relaxed">
                          {step.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
