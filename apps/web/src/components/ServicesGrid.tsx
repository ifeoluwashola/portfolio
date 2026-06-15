import { Card } from "@/components/ui/card";
import { CloudCog, ShieldCheck, TrendingDown, CheckCircle2, Code2 } from "lucide-react";

export function ServicesGrid() {
  const services = [
    {
      title: "Infrastructure Cost Audits",
      description: "Stop guessing what drives your cloud bill. We map every dollar of your AWS/GCP/Azure spend to a specific service, identify waste, and implement rightsizing without impacting performance.",
      icon: TrendingDown,
      deliverables: [
        "Custom FinOps dashboards mapping cost to product features",
        "Automated rightsizing recommendations",
        "Immediate cost reduction (typically 20-40% on first pass)"
      ]
    },
    {
      title: "CI/CD Pipeline Rebuilds",
      description: "Releasing software shouldn't require a prayer and a weekend. We tear down fragile, manual deployment scripts and replace them with automated, secure, push-button pipelines.",
      icon: ShieldCheck,
      deliverables: [
        "Zero-downtime deployment strategies (Blue/Green, Canary)",
        "Automated rollback mechanisms",
        "Security scanning integrated directly into the pipeline"
      ]
    },
    {
      title: "Kubernetes Architecture & Migration",
      description: "Moving to Kubernetes is easy. Running it efficiently in production is hard. We design fault-tolerant clusters that scale automatically and don't cost a fortune to maintain.",
      icon: CloudCog,
      deliverables: [
        "Production-grade EKS/GKE cluster design",
        "GitOps workflows using ArgoCD or Flux",
        "Automated pod and cluster autoscaling"
      ]
    },
    {
      title: "Infrastructure as Code (IaC)",
      description: "No more undocumented click-ops. We codify your entire infrastructure using Terraform or Pulumi, making your environments reproducible, reviewable, and disaster-ready.",
      icon: Code2,
      deliverables: [
        "Complete translation of manual infrastructure to code",
        "Configuration drift detection",
        "Modular architecture for spinning up new environments in minutes"
      ]
    }
  ];

  return (
    <section id="services" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center mb-16 sm:mb-20">
          <h2 className="text-base font-semibold leading-7 text-kn-accent tracking-widest uppercase">WHAT WE DO</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl">
            Where we operate.
          </p>
          <p className="mt-6 text-lg leading-8 text-kn-muted">
            We don&apos;t do generic IT support. We solve specific, high-leverage infrastructure problems.
          </p>
        </div>

        <div className="space-y-16 sm:space-y-24">
          {services.map((service, index) => {
            const isEven = index % 2 === 0;
            return (
              <div key={service.title} className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
                <div className={`w-full lg:w-1/2 ${isEven ? "lg:order-1" : "lg:order-2"}`}>
                  <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-kn-accent-bg ring-1 ring-kn-border">
                    <service.icon className="h-8 w-8 text-kn-accent" aria-hidden="true" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight text-kn-heading mb-4">{service.title}</h3>
                  <p className="text-lg text-kn-muted mb-8 text-balance">
                    {service.description}
                  </p>
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-kn-heading uppercase tracking-widest text-sm mb-4">Key Deliverables</h4>
                    {service.deliverables.map((deliverable) => (
                      <div key={deliverable} className="flex items-center gap-3">
                        <CheckCircle2 className="h-5 w-5 text-kn-accent" />
                        <span className="text-kn-muted">{deliverable}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className={`w-full lg:w-1/2 ${isEven ? "lg:order-2" : "lg:order-1"}`}>
                  <Card className="bg-kn-card backdrop-blur-sm border border-kn-border hover:border-kn-accent/30 transition-all duration-500 h-[300px] sm:h-[400px] flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-kn-bg via-kn-bg/90 to-kn-accent/5 z-0"></div>
                    
                    {/* Abstract tech representation pattern */}
                    <div className="absolute inset-0 z-0 opacity-10 dark:opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                    
                    <service.icon className="h-32 w-32 md:h-48 md:w-48 text-kn-accent opacity-15 group-hover:scale-110 group-hover:opacity-25 transition-all duration-700 z-10" />
                  </Card>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
