import { Shield, TrendingUp, Cpu, BookOpen, Network } from "lucide-react";

export function FirmPhilosophy() {
  const values = [
    {
      title: "Resilience by Design",
      description: "We build systems that anticipate and gracefully handle failure.",
      icon: Shield,
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      hoverGradient: "group-hover:from-emerald-500/10"
    },
    {
      title: "ROI-Driven Engineering",
      description: "Every line of infrastructure-as-code must justify its cost.",
      icon: TrendingUp,
      color: "text-sky-400",
      bgColor: "bg-sky-500/10",
      borderColor: "border-sky-500/20",
      hoverGradient: "group-hover:from-sky-500/10"
    },
    {
      title: "Automation over Toil",
      description: "If a process must be done twice, it gets scripted and automated.",
      icon: Cpu,
      color: "text-indigo-400",
      bgColor: "bg-indigo-500/10",
      borderColor: "border-indigo-500/20",
      hoverGradient: "group-hover:from-indigo-500/10"
    },
    {
      title: "Radical Transparency",
      description: "No black-box infrastructure. We document everything and upskill your team as we build.",
      icon: BookOpen,
      color: "text-rose-400",
      bgColor: "bg-rose-500/10",
      borderColor: "border-rose-500/20",
      hoverGradient: "group-hover:from-rose-500/10"
    },
    {
      title: "Scalability",
      description: "We architect distributed systems that scale from zero to millions of requests, ensuring high availability and seamless growth.",
      icon: Network,
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
      borderColor: "border-amber-500/20",
      hoverGradient: "group-hover:from-amber-500/10"
    }
  ];

  return (
    <section id="philosophy" className="py-24 sm:py-32 bg-background relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#0ea5e9] to-[#10b981] opacity-5 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-emerald-400 uppercase tracking-widest">Our DNA</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Vision & Mission
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-lg leading-8 text-muted-foreground text-left sm:text-center">
            <p className="bg-card/40 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col justify-center h-full">
              <span className="block text-emerald-400 font-bold mb-3 text-xl tracking-wide uppercase">The Vision</span> 
              <span>&quot;To engineer a digital ecosystem where cloud infrastructure is an invisible catalyst for product growth, never a bottleneck or a financial drain.&quot;</span>
            </p>
            <p className="bg-card/40 backdrop-blur-sm border border-border p-8 rounded-2xl flex flex-col justify-center h-full">
              <span className="block text-sky-400 font-bold mb-3 text-xl tracking-wide uppercase">The Mission</span> 
              <span>&quot;We partner with high-growth engineering teams to architect scalable, secure, and cost-efficient cloud-native environments through aggressive automation and DevOps principles.&quot;</span>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-8 text-center sm:text-left">
            {values.map((value) => (
              <div key={value.title} className={`bg-card/40 backdrop-blur-sm border ${value.borderColor} rounded-2xl p-6 hover:border-foreground/20 transition-all duration-300 relative overflow-hidden group`}>
                <div className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${value.hoverGradient}`}></div>
                <div className="relative z-10">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${value.bgColor} sm:mx-0 mx-auto`}>
                    <value.icon className={`h-6 w-6 ${value.color}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{value.title}</h3>
                  <p className="text-sm leading-6 text-muted-foreground">
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
