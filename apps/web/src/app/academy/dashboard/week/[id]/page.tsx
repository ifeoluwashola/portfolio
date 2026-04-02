"use client";

import { useEffect, useState, use } from "react";
import { 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  ArrowRight,
  Terminal,
  Send,
  Loader2,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getDashboardData, submitAssignment } from "../../../actions";

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  status: 'locked' | 'pre-flight' | 'live' | 'archived';
  meet_link?: string;
  recording_url?: string;
}

interface Assignment {
  id: string;
  github_url: string;
  status: 'pending' | 'passed' | 'failed';
  admin_feedback?: string;
  week_id: number;
}

export default function WeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [week, setWeek] = useState<CohortWeek | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [githubUrl, setGithubUrl] = useState("");

  useEffect(() => {
    async function fetchWeekData() {
      try {
        const data = await getDashboardData();
        if (data && !data.error) {
          const foundWeek = data.weeks?.find((w: CohortWeek) => w.id === parseInt(id));
          const foundAss = data.assignments?.find((a: Assignment) => a.week_id === parseInt(id));
          setWeek(foundWeek || null);
          setAssignment(foundAss || null);
          if (foundAss) setGithubUrl(foundAss.github_url);
        }
      } catch (err) {
        console.error("Failed to fetch week data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeekData();
  }, [id]);

  async function handleSubmitAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const result = await submitAssignment(parseInt(id), githubUrl);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Re-fetch to show pending status
      const data = await getDashboardData();
      if (data && !data.error) {
        const foundAss = data.assignments?.find((a: Assignment) => a.week_id === parseInt(id));
        setAssignment(foundAss || null);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="flex items-center gap-2 text-yellow-500 animate-pulse font-mono tracking-widest uppercase text-sm"><Loader2 className="w-4 h-4 animate-spin" /> Synchronizing_Module_{id}...</div>;
  if (!week) return <div className="text-red-400 font-mono">Module_ID_Invalid: Critical link failure.</div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Week Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-[10px] font-bold text-yellow-500/60 border-yellow-500/20 px-2 uppercase font-mono">
            Module_0{week.week_number}
          </Badge>
          <div className="h-px bg-slate-900 flex-1" />
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-100">{week.title}</h1>
      </div>

      {/* Dynamic Content States */}
      {week.status === 'locked' && (
        <div className="bg-slate-900/50 border border-slate-900 rounded-3xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-800">
            <Lock className="w-8 h-8 text-slate-700" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-400">ACCESS_DENIED: Critical Module Encryption</h3>
            <p className="text-slate-600 text-sm max-w-sm mx-auto leading-relaxed italic"> This curriculum block is currently locked by central command. Module will unlock sequentially following prerequisite completion. </p>
          </div>
        </div>
      )}

      {week.status === 'pre-flight' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 flex flex-col items-center text-center space-y-8">
           <div className="flex items-center gap-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Status: Ready_to_Execute</span>
          </div>
          
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight">Syllabus Synchronization Complete</h2>
            <p className="text-slate-500 text-sm leading-relaxed"> The environment is provisioned. Labs are compiled. Waiting for instructor to initiate the live session relay for this module. Check the Telegram group for the live ping. </p>
          </div>

          <div className="w-full h-px bg-slate-900" />
          
          <div className="flex flex-col items-center gap-2 opacity-50 cursor-not-allowed">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-700 mb-2">
              <PlayCircle className="w-10 h-10" />
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Awaiting Signal...</p>
          </div>
        </div>
      )}

      {week.status === 'live' && (
        <div className="bg-slate-900 border-2 border-yellow-500/20 rounded-3xl p-12 text-center space-y-10 relative overflow-hidden group">
          <div className="absolute inset-0 bg-yellow-500/[0.02] animate-pulse" />
          
          <div className="relative z-10 space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-[0.2em]">Live_Stream_Active</span>
            </div>
            
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tight uppercase">EXECUTE: Join Live Class</h2>
              <p className="text-slate-500 text-sm max-w-sm mx-auto tracking-tighter"> The instructor is currently broadcasting this module. Link into the operational bridge now. </p>
            </div>

            <a 
              href={week.meet_link || "#"} 
              target="_blank" 
              className="inline-flex items-center gap-4 px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-2xl font-bold text-lg uppercase transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.4)] group"
            >
              <Terminal className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              ENTER_LIVE_OPS_BRIDGE
              <ChevronRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      )}

      {week.status === 'archived' && (
        <div className="space-y-12">
          {/* Video Player */}
          <div className="aspect-video w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl group flex items-center justify-center">
            {week.recording_url ? (
               <iframe 
                src={week.recording_url} 
                className="w-full h-full border-none"
                allow="autoplay"
                title="Class Recording"
               />
            ) : (
              <div className="text-center space-y-4">
                <div className="w-12 h-12 text-slate-700 mx-auto border border-slate-800 rounded-full flex items-center justify-center">?</div>
                <p className="text-slate-500 text-xs italic font-mono uppercase tracking-widest">RECORDING_NOT_FOUND: Processing_Buffer...</p>
              </div>
            )}
          </div>

          {/* Assignment Submission Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-yellow-500" />
                  Terminal: Submit_PR
                </h3>
                {assignment ? (
                   <Badge variant={
                    assignment.status === 'passed' ? 'default' : 
                    assignment.status === 'failed' ? 'destructive' : 'secondary'
                  } className="capitalize text-[10px] font-mono tracking-widest">
                    {assignment.status}
                  </Badge>
                ) : (
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] italic">Open_Deployment</span>
                )}
              </div>

              <form onSubmit={handleSubmitAssignment} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                    GitHub_Repository_URL
                    {assignment?.status === 'passed' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validated</span>}
                  </label>
                  <div className="relative group/input">
                    <input 
                      type="url" 
                      required
                      placeholder="https://github.com/user/kybern-lab-01"
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-4 text-sm text-yellow-500 focus:outline-none focus:border-yellow-500/40 transition-all font-mono"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      disabled={submitting || assignment?.status === 'passed'}
                    />
                  </div>
                </div>

                {assignment?.admin_feedback && (
                  <div className="p-4 bg-slate-950 border-l-2 border-yellow-500/40 rounded-r-xl space-y-2">
                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                      <Terminal className="w-3 h-3" />
                      Instructor_Feedback_log
                    </p>
                    <p className="text-sm text-slate-400 italic leading-relaxed">
                      &quot;{assignment.admin_feedback}&quot;
                    </p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={submitting || assignment?.status === 'passed'}
                  className={`w-full py-5 rounded-2xl font-bold uppercase transition-all flex items-center justify-center gap-4 group ${
                    assignment?.status === 'passed' 
                      ? 'bg-slate-900/50 border border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                  }`}
                >
                  {submitting ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      <Send className={`w-5 h-5 ${assignment?.status === 'passed' ? "" : "group-hover:translate-x-1 group-hover:-translate-y-1"} transition-transform`} />
                      {assignment?.status === 'passed' ? "Module_Validated" : assignment ? "Resubmit_Solution" : "Commit_Pull_Request"}
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Resources / Docs Mini Box */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 flex flex-col">
              <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-600 mb-6">Lab_Documentation</h4>
              <div className="flex-1 space-y-4">
                {[
                  { title: "Linux Basics Manifesto", icon: <CheckCircle2 className="w-4 h-4" /> },
                  { title: "Standard Library Specs", icon: <CheckCircle2 className="w-4 h-4" /> },
                  { title: "Deployment Instructions", icon: <ArrowRight className="w-4 h-4" /> }
                ].map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-slate-950/50 border border-slate-800/50 rounded-2xl hover:border-slate-700 transition-all cursor-pointer group">
                    <span className="text-sm text-slate-400 group-hover:text-slate-100 transition-colors font-bold tracking-tight">{doc.title}</span>
                    <div className="text-slate-600 group-hover:text-yellow-500 transition-all">
                      {doc.icon}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-600 mt-8 italic text-center uppercase tracking-widest">
                Checksum: Verifying_integrity_v4.2
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
