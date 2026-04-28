import { Shield, TrendingUp, Cpu, BookOpen, Network } from "lucide-react";

export function FirmPhilosophy() {
  const values = [
    {
      title: "Resilience by Design",
      description: "We build systems that anticipate and gracefully handle failure.",
      icon: Shield,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
      borderColor: "border-slate-800",
      hoverGradient: "group-hover:from-[#eab308]/10"
    },
    {
      title: "ROI-Driven Engineering",
      description: "Every line of infrastructure-as-code must justify its cost.",
      icon: TrendingUp,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
      borderColor: "border-slate-800",
      hoverGradient: "group-hover:from-[#eab308]/10"
    },
    {
      title: "Automation over Toil",
      description: "If a process must be done twice, it gets scripted and automated.",
      icon: Cpu,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
      borderColor: "border-slate-800",
      hoverGradient: "group-hover:from-[#eab308]/10"
    },
    {
      title: "Radical Transparency",
      description: "No black-box infrastructure. We document everything and upskill your team as we build.",
      icon: BookOpen,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
      borderColor: "border-slate-800",
      hoverGradient: "group-hover:from-[#eab308]/10"
    },
    {
      title: "Scalability",
      description: "We architect distributed systems that scale from zero to millions of requests, ensuring high availability and seamless growth.",
      icon: Network,
      color: "text-[#eab308]",
      bgColor: "bg-[#eab308]/10",
      borderColor: "border-slate-800",
      hoverGradient: "group-hover:from-[#eab308]/10"
    }
  ];

  return (
    <section id="philosophy" className="py-24 sm:py-32 bg-[#0f172a] relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl" aria-hidden="true">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#eab308]/20 to-transparent opacity-5 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-screen-2xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-base font-semibold leading-7 text-[#eab308] uppercase tracking-widest">Our DNA</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Vision & Mission
          </p>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 text-lg leading-8 text-slate-400 text-left sm:text-center">
            <p className="bg-slate-900 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl flex flex-col justify-center h-full">
              <span className="block text-[#eab308] font-bold mb-3 text-xl tracking-wide uppercase">The Vision</span> 
              <span>&quot;To engineer a digital ecosystem where cloud infrastructure is an invisible catalyst for product growth, never a bottleneck or a financial drain.&quot;</span>
            </p>
            <p className="bg-slate-900 backdrop-blur-sm border border-slate-800 p-8 rounded-2xl flex flex-col justify-center h-full">
              <span className="block text-[#eab308] font-bold mb-3 text-xl tracking-wide uppercase">The Mission</span> 
              <span>&quot;We partner with high-growth engineering teams to architect scalable, secure, and cost-efficient cloud-native environments through aggressive automation and DevOps principles.&quot;</span>
            </p>
          </div>
        </div>

        <div className="mx-auto mt-16 sm:mt-20 lg:mt-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-x-6 gap-y-8 text-center sm:text-left">
            {values.map((value) => (
              <div key={value.title} className={`bg-slate-900 backdrop-blur-sm border ${value.borderColor} rounded-2xl p-6 hover:border-[#eab308]/50 transition-all duration-300 relative overflow-hidden group`}>
                <div className={`absolute inset-0 bg-gradient-to-br to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${value.hoverGradient}`}></div>
                <div className="relative z-10">
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl ${value.bgColor} sm:mx-0 mx-auto`}>
                    <value.icon className={`h-6 w-6 ${value.color}`} aria-hidden="true" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-sm leading-6 text-slate-400">
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
