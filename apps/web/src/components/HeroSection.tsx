import { Button } from "@/components/ui/button";
import { ArrowRight, Terminal } from "lucide-react";
import Link from "next/link";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-background pt-24 pb-32 sm:pt-32 sm:pb-40 lg:pb-48">
      {/* Background glowing effects for "Cloud" aesthetic */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0ea5e9] to-[#10b981] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
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
