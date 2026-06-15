import Link from "next/link";
import { ArrowRight, Building2, AlertCircle, Wrench, Trophy } from "lucide-react";

export function ProjectsGrid() {
  const caseStudies = [
    {
      company: "ChiSquares",
      url: "https://chisquares.com",
      headline: "50% cloud cost reduction & zero-downtime migration of 60+ microservices",
      industry: "Research Technology / SaaS",
      problem: "Spending $15k–$30k monthly on GCP, yet experiencing unexplained downtime due to limitations with Google Cloud Run at scale.",
      solution: "Audited infrastructure and migrated workloads to Google Kubernetes Engine (GKE) using a full GitOps approach. Documented and trained internal teams.",
      outcome: "Over 50% cost reduction, 45% increase in deployment velocity, full stack observability, and vastly improved uptime."
    },
    {
      company: "SeedFi",
      url: "https://theseedfi.com",
      headline: "Pipeline automation & AWS EKS migration for a high-volume fintech",
      industry: "Fintech / Financial Services",
      problem: "A fragile, manual deployment flow taking hours to days, operated by a single bottlenecked engineer. Plus, an unstable legacy Kubernetes cluster on KOPS.",
      solution: "Automated the entire CI/CD pipeline and migrated the legacy KOPS cluster to AWS EKS. Provided full documentation and hands-on engineer training.",
      outcome: "Massively increased deployment velocity, faster incident resolution, and rock-solid system stability."
    }
  ];

  return (
    <section id="projects" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-kn-accent/20 to-transparent opacity-10 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-kn-accent tracking-widest uppercase">RESULTS, NOT PROMISES</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl">
            What happens when infrastructure stops being a bottleneck.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-2">
            {caseStudies.map((study) => (
              <div key={study.company} className="bg-kn-card backdrop-blur-sm border border-kn-border rounded-3xl overflow-hidden hover:border-kn-accent/50 transition-all duration-300 relative group flex flex-col h-full shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-kn-accent/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10 p-8 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-6">
                    <span className="inline-flex items-center rounded-full bg-kn-bg px-3 py-1 text-xs font-semibold text-kn-muted ring-1 ring-inset ring-kn-border uppercase tracking-wide">
                      {study.industry}
                    </span>
                    <Link href={study.url} target="_blank" className="text-sm font-bold text-kn-muted hover:text-kn-heading transition-colors flex items-center gap-1 group/link">
                      <Building2 className="w-4 h-4 mr-1" />
                      {study.company} <ArrowRight className="w-3 h-3 group-hover/link:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-kn-heading mb-8 leading-tight">
                    {study.headline}
                  </h3>

                  <div className="space-y-6 flex-grow">
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-kn-heading uppercase tracking-wider mb-2">
                        <AlertCircle className="w-4 h-4 text-kn-faded" /> The Problem
                      </h4>
                      <p className="text-kn-muted text-sm leading-relaxed">{study.problem}</p>
                    </div>
                    <div>
                      <h4 className="flex items-center gap-2 text-sm font-bold text-kn-heading uppercase tracking-wider mb-2">
                        <Wrench className="w-4 h-4 text-kn-faded" /> What We Did
                      </h4>
                      <p className="text-kn-muted text-sm leading-relaxed">{study.solution}</p>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-kn-border">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-kn-heading uppercase tracking-wider mb-2">
                      <Trophy className="w-4 h-4 text-kn-accent" /> The Outcome
                    </h4>
                    <p className="text-xl font-bold text-kn-accent">{study.outcome}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
