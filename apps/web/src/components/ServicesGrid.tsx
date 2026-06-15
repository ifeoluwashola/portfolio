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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {services.map((service) => (
            <div key={service.title} className="flex flex-col bg-kn-card rounded-2xl p-8 border border-kn-border hover:border-kn-accent/50 shadow-lg transition-all group">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-kn-accent-bg ring-1 ring-kn-border group-hover:scale-110 transition-transform">
                <service.icon className="h-7 w-7 text-kn-accent" aria-hidden="true" />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-kn-heading mb-4">{service.title}</h3>
              <p className="text-sm text-kn-muted mb-8 flex-grow leading-relaxed">
                {service.description}
              </p>
              
              <div className="space-y-3 mt-auto pt-6 border-t border-kn-border/50">
                <h4 className="font-semibold text-kn-heading uppercase tracking-widest text-[10px] mb-3">Key Deliverables</h4>
                {service.deliverables.map((deliverable) => (
                  <div key={deliverable} className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-kn-accent mt-0.5 flex-shrink-0" />
                    <span className="text-kn-muted text-xs leading-snug">{deliverable}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
