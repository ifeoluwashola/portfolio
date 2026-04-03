"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Terminal, 
  ChevronRight, 
  Search, 
  ShieldAlert, 
  Code2, 
  Users, 
  Zap,
  ArrowUpRight
} from "lucide-react";

interface BreakItLab {
  id: number;
  title: string;
  scenario: string;
  status: 'active' | 'solved' | 'archived';
  created_at: string;
}

export default function LabsHubPage() {
  const [labs, setLabs] = useState<BreakItLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

  useEffect(() => {
    async function fetchLabs() {
      try {
        const res = await fetch(`${apiBase}/v1/labs`);
        if (!res.ok) throw new Error("Failed to fetch labs");
        const data = await res.json();
        setLabs(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchLabs();
  }, []);

  const filteredLabs = labs.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-yellow-500/30 font-mono pb-20">
      {/* Search Header - Removed sticky to avoid clash with AcademyNavbar */}
      <div className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md z-40">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <span className="text-yellow-500 tracking-tighter">{"> "}</span>
              Break-It_Labs
            </h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Communal Debugging & Infrastructure Audits</p>
          </div>
          
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
            <input 
              type="text" 
              placeholder="Filter scenarios by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-800 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-200 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Hub Strategy Banner */}
        <div className="mb-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2 bg-yellow-500/5 border border-yellow-500/10 rounded-2xl p-8 relative overflow-hidden group">
              <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-yellow-500/10 blur-[60px] rounded-full group-hover:bg-yellow-500/20 transition-all duration-700" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 text-yellow-500 mb-4">
                  <ShieldAlert className="w-5 h-5" />
                  <span className="text-sm font-bold uppercase tracking-widest">Public Honeypot Strategy</span>
                </div>
                <h2 className="text-3xl font-bold mb-4 tracking-tight leading-tight">These labs simulate real <span className="text-yellow-500">production catastrophes.</span></h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-6">
                  Anyone can study the scenarios and browse the fix history. To submit a patch or review peer code, you must be an enrolled Kybern Academy student. 
                </p>
                <div className="flex flex-wrap gap-4">
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                      <Users className="w-3 h-3 text-yellow-500" /> 1.2k Fixing
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase bg-slate-900/50 px-3 py-1.5 rounded-full border border-slate-800">
                      <Zap className="w-3 h-3 text-yellow-500" /> 48 New Scenarios
                   </div>
                </div>
              </div>
           </div>

           <div className="bg-slate-900/30 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold mb-2">Student Access</h3>
                <p className="text-xs text-slate-500 leading-relaxed mb-6">
                  Enrolled students get access to direct feedback from the Kybern team on their lab submissions.
                </p>
              </div>
              <Link 
                href="/academy/login" 
                className="w-full bg-yellow-500 text-slate-950 text-center py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-400 transition-all shadow-[0_4px_20px_rgba(234,179,8,0.2)]"
              >
                Sign In to Fix_
              </Link>
           </div>
        </div>

        {/* Labs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
             Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 bg-slate-900/40 animate-pulse rounded-2xl border border-slate-800/50" />
             ))
          ) : filteredLabs.length > 0 ? (
            filteredLabs.map((lab) => (
              <Link 
                key={lab.id} 
                href={`/academy/break-it-labs/${lab.id}`}
                className="group relative bg-slate-900/20 border border-slate-800 rounded-2xl p-6 hover:border-yellow-500/50 transition-all hover:bg-slate-900/40"
              >
                <div className="flex items-start justify-between mb-8">
                  <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-yellow-500 group-hover:border-yellow-500/20 transition-all">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded border transition-colors ${
                    lab.status === 'active' ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5' :
                    lab.status === 'solved' ? 'text-yellow-500 border-yellow-500/20 bg-yellow-500/5' :
                    'text-slate-500 border-slate-800 bg-slate-900'
                  }`}>
                    {lab.status}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-3 group-hover:text-yellow-500 transition-colors uppercase tracking-tight line-clamp-1">{lab.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 mb-8">
                  {lab.scenario}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-slate-800/50">
                   <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{new Date(lab.created_at).toLocaleDateString()}</span>
                   <div className="flex items-center gap-1 text-yellow-500 text-xs font-bold group-hover:gap-2 transition-all">
                      INSPECT <ArrowUpRight className="w-3 h-3" />
                   </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-900 rounded-3xl">
               <p className="text-slate-500 font-bold uppercase tracking-widest">No matching scenarios found_</p>
            </div>
          )}
        </div>

        {/* Dynamic CTA for Public Users */}
        {!loading && (
          <div className="mt-32 bg-gradient-to-br from-yellow-500/10 to-slate-900 border border-yellow-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
             <div className="relative z-10">
               <h2 className="text-3xl font-bold mb-4 tracking-tighter uppercase">Ready to join the <span className="text-yellow-500">elite?</span></h2>
               <p className="text-slate-400 text-[10px] max-w-xl mx-auto mb-10 leading-relaxed uppercase tracking-[0.3em]">
                  Stop watching from the sidelines. Secure your spot in Kybern Academy Cohort 2 and master the infrastructure of the future.
               </p>
               <Link 
                 href="/academy#apply" 
                 className="inline-flex items-center gap-3 bg-yellow-500 text-slate-950 px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all shadow-[0_0_40px_rgba(234,179,8,0.2)]"
               >
                  $ Enroll_Now <ChevronRight className="w-4 h-4" />
               </Link>
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
