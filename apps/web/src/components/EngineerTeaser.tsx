import Link from "next/link";
import { ArrowRight, CheckCircle2, Globe, Database, Network } from "lucide-react";

export function EngineerTeaser() {
  return (
    <section className="py-24 bg-kn-bg relative overflow-hidden border-t border-kn-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Narrative */}
          <div className="flex flex-col gap-6">
            <h2 className="text-kn-accent font-bold tracking-widest uppercase text-sm mb-2">WHO YOU&apos;RE WORKING WITH</h2>
            <h3 className="text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl mb-4">
              Senior expertise. No junior handoffs.
            </h3>
            <div className="text-lg text-kn-muted leading-relaxed flex flex-col gap-4">
              <p>
                When you engage Kybern Nexus, you work directly with the principal engineer — not an account manager. Every audit, every architecture decision, every line of infrastructure code comes from someone with years of production experience across AWS, GCP, and enterprise-grade systems.
              </p>
              <p>
                We&apos;ve designed systems that handle millions of requests. We&apos;ve cut cloud bills by six figures. We&apos;ve shipped CI/CD pipelines that teams have run confidently for years without us.
              </p>
            </div>
            
            <div className="mt-6">
              <Link 
                href="/consulting/about"
                className="inline-flex items-center gap-2 text-kn-accent hover:brightness-110 font-bold transition-all text-lg group"
              >
                Read Our Full Story <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
          
          {/* Right Column: Founder Credentials Callout */}
          <div className="bg-kn-card border border-kn-border rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-kn-accent/5 rounded-bl-full pointer-events-none group-hover:bg-kn-accent/10 transition-colors"></div>
            
            <h4 className="text-xl font-bold text-kn-heading border-b border-kn-border pb-4 mb-6">
              Founder Credentials
            </h4>
            
            <ul className="space-y-6">
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-kn-accent-bg flex items-center justify-center shrink-0 border border-kn-accent/20">
                  <Globe className="w-6 h-6 text-kn-accent" />
                </div>
                <div>
                  <h5 className="font-bold text-kn-heading text-lg">3 Continents</h5>
                  <p className="text-sm text-kn-muted">Nigeria &middot; Belgium &middot; United States</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-kn-accent-bg flex items-center justify-center shrink-0 border border-kn-accent/20">
                  <Database className="w-6 h-6 text-kn-accent" />
                </div>
                <div>
                  <h5 className="font-bold text-kn-heading text-lg">60+ Microservices</h5>
                  <p className="text-sm text-kn-muted">Migrated with zero downtime (fintech, research, crypto at scale).</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-kn-accent-bg flex items-center justify-center shrink-0 border border-kn-accent/20">
                  <Network className="w-6 h-6 text-kn-accent" />
                </div>
                <div>
                  <h5 className="font-bold text-kn-heading text-lg">5+ Years</h5>
                  <p className="text-sm text-kn-muted">in production AWS, Azure &amp; GCP environments.</p>
                </div>
              </li>
              <li className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-kn-accent-bg flex items-center justify-center shrink-0 border border-kn-accent/20">
                  <CheckCircle2 className="w-6 h-6 text-kn-accent" />
                </div>
                <div>
                  <h5 className="font-bold text-kn-heading text-lg">Currently Active</h5>
                  <p className="text-sm text-kn-muted">Lead DevOps Engineer at a US tech company — bringing live production experience to every engagement.</p>
                </div>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
}
