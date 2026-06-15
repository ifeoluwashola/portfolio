import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServerCrash, CircleDollarSign, ShieldAlert } from "lucide-react";

export function PainPointsSection() {
  return (
    <section id="pain-points" className="py-24 sm:py-32 bg-kn-bg border-t border-kn-border relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-kn-accent/20 to-transparent opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-kn-accent uppercase tracking-widest">
            SOUND FAMILIAR?
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl max-w-3xl mx-auto">
            The infrastructure debt cycle: scaling too fast, auditing too late.
          </p>
        </div>

        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3 items-start">
            {/* Bloated Cloud Runway */}
            <Card className="bg-kn-card backdrop-blur-sm border-kn-border hover:border-kn-accent/30 transition-all duration-300 relative overflow-hidden group shadow-lg">
              <div className="absolute inset-0 bg-gradient-to-br from-kn-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-kn-accent-bg mb-4 ring-1 ring-kn-accent/30 group-hover:bg-kn-accent/15 transition-colors">
                  <CircleDollarSign className="h-6 w-6 text-kn-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-kn-heading group-hover:text-kn-accent transition-colors">
                  01 Your cloud bill keeps climbing — but nothing is getting faster.
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-kn-muted leading-relaxed">
                  Idle resources, over-provisioned nodes, and staging environments running 24/7 silently eat your budget. Most teams don&apos;t notice until they model their runway.
                  <br/><br/>
                  <span className="italic">Average waste we find in first-time audits:</span> 30–40% of monthly spend.<br/>
                  <span className="italic">Common culprits:</span> unattached volumes, oversized VMs, forgotten dev environments.
                </p>
              </CardContent>
            </Card>

            {/* Deployment Paralysis */}
            <Card className="bg-kn-card backdrop-blur-sm border-kn-border hover:border-kn-accent/30 transition-all duration-300 relative overflow-hidden group shadow-lg lg:mt-12">
              <div className="absolute inset-0 bg-gradient-to-br from-kn-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-kn-accent-bg mb-4 ring-1 ring-kn-accent/30 group-hover:bg-kn-accent/15 transition-colors">
                  <ServerCrash className="h-6 w-6 text-kn-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-kn-heading group-hover:text-kn-accent transition-colors leading-tight">
                  02 Releases take days. Your best engineers are losing patience.
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-kn-muted leading-relaxed">
                  Manual approvals, fragile deployment scripts, and no automated rollback mean your team spends more time managing releases than building product. That&apos;s how you lose great engineers.
                  <br/><br/>
                  <span className="italic">Deployment cycles over 24 hours signal a pipeline problem, not a people problem.</span><br/>
                  We&apos;ve cut release times from 3 days to 45 minutes without touching your codebase.
                </p>
              </CardContent>
            </Card>

            {/* Hidden Security Vectors */}
            <Card className="bg-kn-card backdrop-blur-sm border-kn-border hover:border-kn-accent/30 transition-all duration-300 relative overflow-hidden group shadow-lg lg:mt-24">
              <div className="absolute inset-0 bg-gradient-to-br from-kn-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <CardHeader className="relative z-10">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-kn-accent-bg mb-4 ring-1 ring-kn-accent/30 group-hover:bg-kn-accent/15 transition-colors">
                  <ShieldAlert className="h-6 w-6 text-kn-accent" />
                </div>
                <CardTitle className="text-xl font-semibold text-kn-heading group-hover:text-kn-accent transition-colors leading-tight">
                  03 You know there are security gaps. You just haven&apos;t had time to fix them.
                </CardTitle>
              </CardHeader>
              <CardContent className="relative z-10">
                <p className="text-kn-muted leading-relaxed">
                  Permissive IAM roles, hardcoded secrets, unpatched containers — they accumulate quietly. A breach doesn&apos;t give you a warning. It gives you a bill and a PR crisis.
                  <br/><br/>
                  <span className="italic">One credential exposure can cost more than 12 months of proactive security work.</span><br/>
                  We surface and close the gaps before they become incidents.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
