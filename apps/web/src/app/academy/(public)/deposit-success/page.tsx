import { CheckCircle, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DepositSuccessPage() {
  return (
    <div className="bg-background min-h-[80vh] flex flex-col items-center justify-center relative font-sans text-foreground px-6">
      {/* Background Developer Motif */}
      <div className="absolute inset-x-0 top-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Top Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none blur-[100px] bg-emerald-500/30 rounded-full" />

      <div className="max-w-xl w-full bg-card/60 backdrop-blur-md rounded-3xl p-10 sm:p-14 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] text-center relative z-10">
        <div className="w-20 h-20 mx-auto bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30">
          <CheckCircle className="w-10 h-10 text-emerald-400" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-yellow-400">
          Deposit Confirmed.
        </h1>
        
        <p className="text-muted-foreground text-lg mb-4 leading-relaxed">
          Your commitment deposit has been successfully processed and recorded. This amount will be applied directly toward your Cohort 2 tuition.
        </p>

        <div className="bg-secondary/50 rounded-xl p-6 mb-8 border border-border">
          <div className="flex items-center justify-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span className="text-sm font-bold text-yellow-400 uppercase tracking-wider">What Happens Next</span>
          </div>
          <ul className="text-muted-foreground text-sm space-y-2 text-left max-w-sm mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>A confirmation receipt has been sent to your email</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>You&apos;ll get priority access when Cohort 2 enrollment opens</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-0.5">✓</span>
              <span>You can top up your deposit anytime to reduce future tuition</span>
            </li>
          </ul>
        </div>
        
        <div className="space-y-4">
          <Link 
            href="/academy/register"
            className="flex items-center justify-center w-full py-4 px-6 rounded-xl font-bold text-emerald-400 hover:text-emerald-300 transition-colors group"
          >
            Top Up My Deposit
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link 
            href="/academy"
            className="flex items-center justify-center w-full py-4 px-6 rounded-xl font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
          >
            Return to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
