import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal, Cloud, Database, Network, Server } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pb-48">
      {/* Dynamic Grid Background - Guaranteed SVG Render */}
      <div className="absolute inset-0 -z-20 h-full w-full">
        <svg className="absolute inset-0 h-full w-full opacity-30 dark:opacity-20" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M0 40V0H40" fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
        <div className="absolute left-0 right-0 top-0 -z-20 m-auto h-[400px] w-[400px] rounded-full bg-emerald-500 opacity-30 blur-[120px]"></div>
        <div className="absolute left-1/3 right-0 top-1/2 -z-20 m-auto h-[300px] w-[300px] rounded-full bg-sky-500 opacity-30 blur-[120px]"></div>
      </div>

      {/* Floating Tech Icons Layer - Increased Opacity & Size */}
      <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none opacity-40 dark:opacity-50">
        <Server className="absolute top-1/4 left-1/4 w-20 h-20 text-emerald-500/60 animate-pulse" style={{ animationDuration: '4s' }} />
        <Cloud className="absolute top-1/3 right-1/4 w-24 h-24 text-sky-500/60 animate-pulse" style={{ animationDuration: '6s' }} />
        <Database className="absolute bottom-1/4 left-1/3 w-16 h-16 text-emerald-500/60 animate-pulse" style={{ animationDuration: '5s' }} />
        <Network className="absolute bottom-1/3 right-1/3 w-20 h-20 text-sky-500/60 animate-pulse" style={{ animationDuration: '7s' }} />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          <div className="hidden sm:mb-8 sm:flex sm:justify-center">
            <div className="relative rounded-full px-4 py-1.5 text-sm leading-6 text-muted-foreground ring-1 ring-border/50 hover:ring-border bg-background/50 backdrop-blur-sm transition-all shadow-sm">
              <span className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Senior DevOps & Cloud Engineer.{" "}
                <Link href="#services" className="font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-500 transition-colors">
                  View Consulting Services <span aria-hidden="true">&rarr;</span>
                </Link>
              </span>
            </div>
          </div>
          
          <h1 className="text-5xl tracking-tight text-foreground sm:text-7xl font-extrabold flex flex-col gap-2">
            <span>Optimizing Cloud ROI</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-emerald-400 to-sky-400 animate-gradient-x">through DevOps.</span>
          </h1>
          
          <p className="mt-8 text-lg leading-8 text-muted-foreground max-w-2xl mx-auto">
            Helping companies scale reliably and reduce costs. Specializing in high-performance infrastructure, seamless CI/CD pipelines, and secure cloud environments.
          </p>
          
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-sky-500 hover:bg-sky-400 text-white gap-2 font-semibold shadow-lg shadow-sky-500/20 hover:shadow-sky-500/40 transition-all h-12 px-8">
              <Terminal size={18} />
              Book an Audit
            </Button>
            <Button size="lg" variant="outline" className="gap-2 border-border hover:bg-accent hover:text-accent-foreground h-12 px-8 bg-background/50 backdrop-blur-sm">
              View Portfolio <ArrowRight size={18} />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
