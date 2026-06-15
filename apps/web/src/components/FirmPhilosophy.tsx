import { Shield, TrendingUp, Cpu, BookOpen, Network } from "lucide-react";

export function FirmPhilosophy() {
  const values = [
    {
      title: "We bill against outcomes, not hours.",
      description: "Every change we make has a measurable business justification — whether that's cost saved, time recovered, or risk eliminated.",
      icon: TrendingUp,
    },
    {
      title: "We document everything.",
      description: "No black-box handoffs. Your team gets full documentation and hands-on knowledge transfer so they're confident running the new infrastructure independently.",
      icon: BookOpen,
    },
    {
      title: "We automate what shouldn't be manual.",
      description: "If something gets done more than once by a human, we script it. Toil is the enemy of engineering velocity.",
      icon: Cpu,
    },
    {
      title: "We design for the failure that will eventually happen.",
      description: "Resilience isn't a feature you add later. We build it in from the architecture phase so your system recovers gracefully when — not if — something breaks.",
      icon: Shield,
    }
  ];

  return (
    <section id="philosophy" className="py-24 sm:py-32 bg-kn-bg relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-kn-accent/20 to-transparent opacity-5 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-kn-accent uppercase tracking-widest">HOW WE THINK</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-kn-heading sm:text-4xl max-w-4xl mx-auto">
            Agencies build a black box and hand you the keys. We build alongside your team and hand them the playbook.
          </p>
        </div>

        <div className="mx-auto mt-16 sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 text-center sm:text-left">
            {values.map((value) => (
              <div key={value.title} className="bg-kn-card backdrop-blur-sm border border-kn-border rounded-2xl p-6 hover:border-kn-accent/50 transition-all duration-300 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-kn-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-kn-accent-bg sm:mx-0 mx-auto">
                    <value.icon className="h-6 w-6 text-kn-accent" aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-kn-heading mb-2">{value.title}</h3>
                  <p className="text-sm leading-6 text-kn-muted">
                    {value.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
