import Link from "next/link";
import { ShieldAlert, LogOut } from "lucide-react";

export default function AccessRevokedPage() {
  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
          <div className="p-6 bg-red-950/30 border-2 border-red-500/50 rounded-full text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
            <ShieldAlert size={64} className="animate-pulse" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tighter text-white">
            ACCESS <span className="text-red-500 font-mono">DENIED</span>
          </h1>
          <p className="text-slate-400 text-lg">
            Your Academy credentials have been flagged for termination.
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-xl text-left space-y-4">
          <p className="text-sm text-slate-300 leading-relaxed italic">
            &quot;We regret to inform you that your student status at Kybern Academy has been changed to <span className="text-red-400 font-bold">Disqualified</span>. As per policy, your access to the Student Dashboard and internal lab environments has been revoked immediately.&quot;
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link
            href="/academy"
            className="w-full bg-[#eab308] text-[#020617] font-bold py-3 rounded-lg hover:bg-[#ca8a04] transition-colors flex items-center justify-center gap-2"
          >
            Return to Public Academy
          </Link>
          <Link
             href="/"
             className="text-slate-500 hover:text-slate-300 text-sm flex items-center justify-center gap-1 transition-colors"
          >
            <LogOut size={16} /> Contact Support
          </Link>
        </div>

        <div className="pt-8 opacity-20 select-none">
          <div className="text-[10px] font-mono text-slate-500 overflow-hidden whitespace-nowrap">
            AUTH_TERMINATED // SESSION_REVOKED // SECURITY_FLAG_403 // ACADEMY_CORE_SHUTDOWN // 
          </div>
        </div>
      </div>
    </div>
  );
}
