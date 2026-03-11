import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pb-48">
      {/* Dynamic Grid Background */}
      <div 
        className="absolute inset-0 -z-20 h-full w-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"
        aria-hidden="true"
      >
        <div className="absolute left-0 right-0 top-0 -z-20 m-auto h-[310px] w-[310px] rounded-full bg-emerald-400 opacity-20 blur-[100px]"></div>
        <div className="absolute left-1/3 right-0 top-1/2 -z-20 m-auto h-[250px] w-[250px] rounded-full bg-sky-400 opacity-20 blur-[100px]"></div>
      </div>

      {/* Floating Tech Icons Layer */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
        <Server className="absolute top-1/4 left-1/4 w-12 h-12 text-emerald-500 animate-pulse" style={{ animationDuration: '4s' }} />
        <Cloud className="absolute top-1/3 right-1/4 w-16 h-16 text-sky-500 animate-pulse" style={{ animationDuration: '6s' }} />
        <Database className="absolute bottom-1/4 left-1/3 w-10 h-10 text-emerald-500 animate-pulse" style={{ animationDuration: '5s' }} />
        <Network className="absolute bottom-1/3 right-1/3 w-14 h-14 text-sky-500 animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-3 py-1 text-sm leading-6 text-muted-foreground ring-1 ring-border hover:ring-foreground/20">
              Senior DevOps & Cloud Engineer.{" "}
              <Link href="#services" className="font-semibold text-sky-600 dark:text-sky-400">
                <span className="absolute inset-0" aria-hidden="true" />
                View Consulting Services <span aria-hidden="true">&rarr;</span>
              </Link>
            </div>
          </div>
          
          <h1 className="text-4xl tracking-tight text-foreground sm:text-6xl font-bold">
            Optimizing Cloud ROI through <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-emerald-400">DevOps Automation.</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Helping companies scale reliably and reduce costs. Specializing in high-performance infrastructure, seamless CI/CD pipelines, and secure cloud environments.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-sky-500 hover:bg-sky-400 text-white gap-2 font-semibold">
              <Terminal size={18} />
              Book an Audit
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-border hover:bg-accent hover:text-accent-foreground">
              View Portfolio <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
