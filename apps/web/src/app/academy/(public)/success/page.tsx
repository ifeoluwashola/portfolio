import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AcademySuccessPage() {
  return (
    <div className="bg-background min-h-[80vh] flex flex-col items-center justify-center relative font-sans text-foreground px-6">
      {/* Background Developer Motif */}
      <div className="absolute inset-x-0 top-0 -z-10 h-full w-full bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px]"></div>
      
      {/* Top Gradient Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-20 pointer-events-none blur-[100px] bg-yellow-500/30 rounded-full" />

      <div className="max-w-xl w-full bg-card/60 backdrop-blur-md rounded-3xl p-10 sm:p-14 border border-yellow-500/20 shadow-[0_0_50px_rgba(16,185,129,0.05)] text-center relative z-10">
        <div className="w-20 h-20 mx-auto bg-yellow-500/10 rounded-full flex items-center justify-center mb-8 border border-yellow-500/30">
          <CheckCircle className="w-10 h-10 text-yellow-400" />
        </div>
        
        <h1 className="text-3xl sm:text-4xl font-extrabold mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-sky-400">
          Payment Successful.<br />Seat Secured.
        </h1>
        
        <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
          Welcome to the cohort. We have sent a confirmation email with your Telegram/WhatsApp invite link and Week 1 prep instructions. Please check your inbox (and spam folder) now.
        </p>
        
        <div className="space-y-4">
          <Link 
            href="/"
            className="flex items-center justify-center w-full py-4 px-6 rounded-xl font-bold bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
          >
            Return to Homepage
          </Link>
          <Link 
            href="/academy/materials"
            className="flex items-center justify-center w-full py-4 px-6 rounded-xl font-bold text-yellow-400 hover:text-yellow-300 transition-colors group"
          >
            Start Prerequisites
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
