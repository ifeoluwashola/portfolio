"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { 
  PlayCircle, 
  Lock, 
  CheckCircle2, 
  Terminal,
  Send,
  Loader2,
  ChevronRight,
  ExternalLink,
  Eye,
  EyeOff,
  Clock,
  History,
  UploadCloud
} from "lucide-react";
import { getDashboardData, submitAssignment, getS3UploadUrl } from "../../../actions";
import { SecureFilePreview } from "@/components/ui/SecureFilePreview";

interface CourseMaterial {
  title: string;
  url: string;
}

interface ClassSession {
  id: number;
  cohort_week_id: number;
  title: string;
  status: 'scheduled' | 'live' | 'archived';
  meeting_url: string;
  scheduled_at: string;
  recording_url: string;
}

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  recording_url?: string;
  materials?: CourseMaterial[];
  transcript?: string;
  assignment_instructions?: string;
  sessions?: ClassSession[];
}

interface Assignment {
  id: string;
  github_url: string;
  status: 'pending' | 'passed' | 'failed';
  admin_feedback?: string;
  week_id: number;
  submission_file_key?: string;
}

export default function WeekPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [week, setWeek] = useState<CohortWeek | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("");
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [githubUrl, setGithubUrl] = useState("");
  const [showTranscript, setShowTranscript] = useState(false);
  const [activeSession, setActiveSession] = useState<ClassSession | null>(null);
  const [attendance, setAttendance] = useState<{ rate: number; attended: number; total: number } | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  
  // Derived states for module status (replacing removed week.status)
  const publishedSessions = week?.sessions || [];
  const isLocked = !loading && week && publishedSessions.length === 0;
  const isPreFlight = !loading && week && publishedSessions.length > 0 && publishedSessions.every(s => s.status === 'scheduled');
  const hasArchivedSessions = publishedSessions.some(s => s.status === 'archived');
  const isAllArchived = publishedSessions.length > 0 && publishedSessions.every(s => s.status === 'archived');

  // Core data-fetching logic, extracted so it can be reused by both the
  // initial load effect and the background polling effect.
  const fetchWeekData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getDashboardData();
      if (data && !data.error) {
        const foundWeek = (data.weeks || []).find((w: CohortWeek) => w.id === parseInt(id));
        const foundAss = (data.assignments || []).find((a: Assignment) => a.week_id === parseInt(id));
        setWeek(foundWeek || null);
        setAssignment(foundAss || null);
        if (foundAss) setGithubUrl(foundAss.github_url);
        setIsReadOnly(data.status === 'graduated' || data.cohort_status === 'graduated');

        if (data.total_held_sessions !== undefined) {
          setAttendance({
            rate: data.attendance_rate,
            attended: data.attended_count,
            total: data.total_held_sessions
          });
        }

        if (foundWeek?.sessions && foundWeek.sessions.length > 0) {
          // Priority: Live > Scheduled (Soonest) > Archived (Latest)
          const liveSess = foundWeek.sessions.find((s: ClassSession) => s.status === 'live');
          const scheduledSess = [...foundWeek.sessions]
            .filter((s: ClassSession) => s.status === 'scheduled')
            .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
          const archivedSessions = foundWeek.sessions.filter((s: ClassSession) => s.status === 'archived');
          const archivedSess = archivedSessions.length > 0 ? archivedSessions[archivedSessions.length - 1] : null;

          setActiveSession(liveSess || scheduledSess || archivedSess || null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch week data:", err);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id]);

  // Initial data load
  useEffect(() => {
    fetchWeekData(false);
  }, [fetchWeekData]);

  // Smart polling: only activates when the active session is 'scheduled'
  // and its start time is within 5 minutes. Polls silently every 30 seconds
  // so the UI transitions automatically when the backend flips it to 'live'.
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Clear any existing poll before deciding to re-establish
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }

    if (
      activeSession?.status === 'scheduled' &&
      activeSession.scheduled_at
    ) {
      const msUntilSession = new Date(activeSession.scheduled_at).getTime() - Date.now();
      const FIVE_MINUTES_MS = 5 * 60 * 1000;

      if (msUntilSession <= FIVE_MINUTES_MS) {
        // Session is within the 5-minute window or has already passed — poll every 20 seconds
        pollingRef.current = setInterval(() => {
          fetchWeekData(true); // silent = true, no loading flicker
        }, 20_000);
      }
    }

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [activeSession, fetchWeekData]);

  async function handleSubmitAssignment(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus("COMMITTING...");

    try {
      let fileKey: string | undefined = undefined;

      if (submissionFile) {
        setSubmitStatus("UPLOADING TO S3...");
        const presignRes = await getS3UploadUrl(submissionFile.name);
        if ("error" in presignRes) {
          throw new Error(presignRes.error);
        }
        
        const uploadUrl = presignRes.upload_url;
        fileKey = presignRes.file_key;

        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          body: submissionFile,
        });

        if (!uploadRes.ok) {
          throw new Error("Failed to upload file to S3");
        }
      }

      setSubmitStatus("COMMITTING...");
      const result = await submitAssignment(parseInt(id), githubUrl, fileKey);

      if (result.error) {
        throw new Error(result.error);
      }
      
      // Re-fetch to show pending status
      const data = await getDashboardData();
      if (data && !data.error) {
        const foundAss = (data.assignments || []).find((a: Assignment) => a.week_id === parseInt(id));
        setAssignment(foundAss || null);
        setSubmissionFile(null);
      }
    } catch (err) {
      console.error("Submission failed:", err);
    } finally {
      setSubmitting(false);
      setSubmitStatus("");
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSubmissionFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSubmissionFile(e.target.files[0]);
    }
  };

  if (loading) return <div className="flex items-center gap-2 text-yellow-500 animate-pulse tracking-widest uppercase text-sm p-10"><Loader2 className="w-4 h-4 animate-spin" /> Synchronizing Module {id}...</div>;
  if (!week) return <div className="text-red-400 p-10">Module ID Invalid: Critical link failure.</div>;

  return (
    <div className="space-y-12 pb-20">
      {/* Week Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-[10px] font-bold text-yellow-500/60 border border-yellow-500/20 px-2 py-0.5 uppercase rounded">
            Module {week.week_number}
          </div>
          <div className="h-px bg-border flex-1" />
          {attendance && (
             <div className="flex items-center gap-4 px-3 py-1 bg-white/5 border border-white/10 rounded-full group cursor-help transition-all hover:border-yellow-500/30">
                <div className="flex flex-col items-start leading-none">
                   <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter mb-0.5">Live Attendance</span>
                   <span className="text-[10px] font-bold text-slate-300">{attendance.attended}/{attendance.total} Sessions</span>
                </div>
                <div className="h-6 w-px bg-white/10" />
                <div className="flex items-center gap-2">
                   <div className="text-xs font-black text-yellow-500">{Math.round(attendance.rate)}%</div>
                   <div className="w-12 h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                         className="h-full bg-yellow-500" 
                         style={{ width: `${attendance.rate}%` }}
                      />
                   </div>
                </div>
             </div>
          )}
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{week.title}</h1>
      </div>

      {/* Dynamic Content States */}
      {isLocked && (
        <div className="bg-card/50 border border-border rounded-3xl p-12 text-center space-y-6">
          <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto border border-border">
            < Lock className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-muted-foreground">ACCESS DENIED: Module Status Locked</h3>
            <p className="text-muted-foreground/60 text-sm max-w-sm mx-auto leading-relaxed"> This deployment block is currently locked by the academy. Modules will unlock sequentially following prerequisite completion. </p>
          </div>
        </div>
      )}

      {isPreFlight && (
        <div className="bg-card border border-border rounded-3xl p-10 flex flex-col items-center text-center space-y-8">
           <div className="flex items-center gap-4 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-full">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Status: Ready to Execute</span>
          </div>
          
          <div className="space-y-4 max-w-xl">
            <h2 className="text-2xl font-bold tracking-tight">Syllabus Synchronization Complete</h2>
            <p className="text-slate-500 text-sm leading-relaxed tracking-tight"> The environment is provisioned. Labs are compiled. Waiting for instructor to initiate the live session relay for this module. Check the Telegram group for the live ping. </p>
          </div>

          <div className="w-full h-px bg-border" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
            <div className="flex flex-col items-center gap-2 opacity-30 cursor-not-allowed grayscale p-6 border border-border rounded-2xl">
              <div className="w-12 h-12 bg-background border border-border rounded-full flex items-center justify-center text-muted-foreground/40 mb-2">
                <PlayCircle className="w-8 h-8" />
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Awaiting Signal...</p>
            </div>
            
            {week.materials && week.materials.length > 0 && (
              <div className="p-6 border border-yellow-500/10 bg-yellow-500/[0.02] rounded-2xl text-left space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-yellow-500/80 underline decoration-yellow-500/20 underline-offset-4">Module Intelligence</h4>
                <div className="space-y-2">
                  {week.materials.map((mat, i) => (
                    <a key={i} href={mat.url} target="_blank" className="flex items-center justify-between text-xs text-muted-foreground hover:text-yellow-500 transition-colors group/link">
                      <span className="font-bold tracking-tight">{mat.title}</span>
                      <ExternalLink className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dynamic Session State: Live/Scheduled Banner */}
      {!isLocked && (
        <>
          {/* If there is an active actionable session (Live or Scheduled) */}
          {(activeSession && (activeSession.status === 'live' || activeSession.status === 'scheduled')) ? (
            <div className={`bg-card border-2 ${activeSession.status === 'live' ? 'border-red-500/20' : 'border-yellow-500/20'} rounded-3xl p-12 text-center space-y-10 relative overflow-hidden group`}>
              <div className={`absolute inset-0 ${activeSession.status === 'live' ? 'bg-red-500/[0.02]' : 'bg-yellow-500/[0.02]'} animate-pulse`} />
              
              <div className="relative z-10 space-y-6">
                <div className={`inline-flex items-center gap-3 px-4 py-1.5 ${activeSession.status === 'live' ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'} rounded-full`}>
                  <div className={`w-2 h-2 rounded-full ${activeSession.status === 'live' ? 'bg-red-600 animate-ping' : 'bg-yellow-500 animate-pulse'}`} />
                  <span className={`text-[10px] font-bold ${activeSession.status === 'live' ? 'text-red-500' : 'text-yellow-500'} uppercase tracking-[0.2em]`}>
                    {activeSession.status === 'live' ? 'Live Stream Active' : 'Next Session Scheduled'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-3xl font-bold tracking-tight uppercase tracking-widest">{activeSession.title}</h2>
                  <p className="text-muted-foreground text-sm max-w-md mx-auto tracking-tight">
                    {activeSession.status === 'live' 
                      ? "The instructor is currently broadcasting this module. Link into the operational bridge now." 
                      : `This session is scheduled for ${new Date(activeSession.scheduled_at).toLocaleDateString()} at ${new Date(activeSession.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`}
                  </p>
                </div>

                {activeSession.status === 'live' && !isReadOnly && (
                  <a 
                    href={`/api/academy/proxy/v1/academy/sessions/${activeSession.id}/join`} 
                    className="inline-flex items-center gap-4 px-10 py-5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 rounded-2xl font-bold text-lg uppercase transition-all shadow-[0_0_40px_rgba(234,179,8,0.3)] hover:shadow-[0_0_60px_rgba(234,179,8,0.4)] group tracking-tighter"
                  >
                    <Terminal className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    ENTER LIVE OPS BRIDGE
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </a>
                )}
              </div>
            </div>
          ) : hasArchivedSessions && (
            <div className="space-y-12">
              <div className="space-y-8">
                {/* Video Hub */}
                <div className="space-y-6">
                  <div className="aspect-video w-full bg-card border border-border rounded-3xl overflow-hidden shadow-2xl relative group">
                    {activeSession?.recording_url ? (
                       <iframe 
                        src={activeSession.recording_url} 
                        className="w-full h-full border-none"
                        allow="autoplay"
                        title="Class Recording"
                       />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="text-center space-y-4">
                          <div className="w-12 h-12 text-muted-foreground/30 mx-auto border border-border rounded-full flex items-center justify-center">?</div>
                          <p className="text-muted-foreground/60 text-xs uppercase tracking-widest">RECORDING NOT FOUND: Processing Buffer...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
            {/* Session Playlist - Archived Only */}
            {week.sessions && week.sessions.filter(s => s.status === 'archived').length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <History className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-500/80">Archived Recordings</h4>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {week.sessions.filter(s => s.status === 'archived').map((sess) => {
                    const isActive = activeSession?.id === sess.id;
                    return (
                      <button 
                        key={sess.id}
                        onClick={() => setActiveSession(sess)}
                        className={`group p-4 bg-card border text-left transition-all duration-300 rounded-2xl relative overflow-hidden ${
                          isActive 
                            ? 'border-yellow-500 ring-1 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                            : 'border-border hover:border-yellow-500/40'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute top-0 right-0 p-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse" />
                          </div>
                        )}
                        <div className="space-y-2 relative z-10">
                          <div className="flex items-center gap-2">
                            <PlayCircle className={`w-4 h-4 ${isActive ? 'text-yellow-500' : 'text-muted-foreground/40 group-hover:text-yellow-500/60'}`} />
                            <span className={`text-xs font-bold truncate ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {sess.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] text-muted-foreground/60 uppercase font-black tracking-widest ml-6">
                            <Clock className="w-3 h-3" />
                            {new Date(sess.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Assignment & Resources Section */}
            {week.assignment_instructions && (
              <div className="bg-card border border-yellow-500/10 rounded-3xl p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <Terminal className="w-5 h-5 text-yellow-500" />
                  <h3 className="text-sm font-black uppercase tracking-[0.15em] text-yellow-500">{'>'}_ LAB SPECIFICATIONS</h3>
                </div>
                <div className="bg-background border border-border rounded-2xl p-6 overflow-x-auto">
                  <div className="prose prose-invert prose-sm max-w-none
                    prose-headings:text-yellow-500 prose-headings:font-bold prose-headings:tracking-tight prose-headings:uppercase
                    prose-h2:text-base prose-h2:border-b prose-h2:border-border prose-h2:pb-2 prose-h2:mb-4
                    prose-h3:text-xs prose-h3:tracking-[0.15em]
                    dark:prose-p:text-muted-foreground prose-p:text-foreground/70 prose-p:leading-relaxed prose-p:text-sm
                    dark:prose-strong:text-slate-200 prose-strong:text-foreground
                    prose-code:text-yellow-500 prose-code:bg-yellow-500/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                    prose-pre:bg-card prose-pre:border prose-pre:border-border prose-pre:rounded-xl
                    dark:prose-li:text-muted-foreground prose-li:text-foreground/70 prose-li:text-sm
                    prose-ul:space-y-1
                    prose-a:text-yellow-500 prose-a:no-underline hover:prose-a:underline
                  ">
                    <ReactMarkdown>{week.assignment_instructions}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-3xl p-8 space-y-8">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold flex items-center gap-3 tracking-tight">
                    <Terminal className="w-5 h-5 text-yellow-500" />
                    Terminal: Submit Pull Request
                  </h3>
                  {assignment ? (
                    <div className={`px-2 py-0.5 rounded border text-[10px] font-bold tracking-widest uppercase ${
                      assignment.status === 'passed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 
                      assignment.status === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 
                      'bg-muted border-border text-muted-foreground'
                    }`}>
                      {assignment.status}
                    </div>
                  ) : (
                    <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">Open Deployment</span>
                  )}
                </div>

                <form onSubmit={handleSubmitAssignment} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                      GitHub Repository URL
                      {assignment?.status === 'passed' && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Validated</span>}
                    </label>
                    <div className="relative group/input">
                      <input 
                        type="url" 
                        required
                        placeholder="https://github.com/user/kybern-lab-01"
                        className="w-full bg-background border border-border rounded-2xl px-6 py-4 text-sm text-yellow-500 focus:outline-none focus:border-yellow-500/40 transition-all font-semibold"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        disabled={submitting || assignment?.status === 'passed'}
                      />
                    </div>
                  </div>

                  {/* Drag and Drop File Upload */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex items-center justify-between">
                      Supplementary Document (Optional)
                      {assignment?.submission_file_key && <span className="text-emerald-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Uploaded</span>}
                    </label>
                    <div 
                      className={`relative flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-2xl transition-all ${submissionFile ? 'border-yellow-500 bg-yellow-500/5' : 'border-[#0f172a] hover:border-[#eab308] hover:bg-[#0f172a]/20 bg-background'}`}
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      onClick={() => !submitting && assignment?.status !== 'passed' && fileInputRef.current?.click()}
                    >
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        onChange={handleFileSelect}
                        disabled={submitting || assignment?.status === 'passed'}
                      />
                      <UploadCloud className={`w-8 h-8 mb-4 ${submissionFile ? 'text-yellow-500' : 'text-slate-600'}`} />
                      <p className="text-sm font-semibold text-slate-300 text-center">
                        {submissionFile ? submissionFile.name : "Drag & drop file here or click to browse"}
                      </p>
                      <p className="text-xs text-slate-500 mt-2 text-center">Max size: 50MB (PDF, DOCX, ZIP, PNG, etc.)</p>
                    </div>
                  </div>

                  {assignment?.admin_feedback && (
                    <div className="p-4 bg-background border-l-2 border-yellow-500/40 rounded-r-xl space-y-2">
                      <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest flex items-center gap-2">
                        <Terminal className="w-3 h-3" />
                        Instructor Feedback
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                        &quot;{assignment.admin_feedback}&quot;
                      </p>
                    </div>
                  )}

                  {/* Uploaded Asset Preview */}
                  {assignment?.submission_file_key && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                        Uploaded Asset
                      </p>
                      <SecureFilePreview
                        fileKey={assignment.submission_file_key}
                        fileName={assignment.submission_file_key.split("-").slice(1).join("-") || "submission"}
                        mode="student"
                      />
                    </div>
                  )}

                  <button 
                    type="submit" 
                    disabled={submitting || assignment?.status === 'passed'}
                    className={`w-full py-5 rounded-2xl font-bold uppercase transition-all flex items-center justify-center gap-4 group tracking-tighter ${
                      assignment?.status === 'passed' 
                        ? 'bg-muted border border-border text-muted-foreground/40 cursor-not-allowed'
                        : 'bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.2)]'
                    }`}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="tracking-widest text-sm">{submitStatus || "COMMITTING..."}</span>
                      </>
                    ) : (
                      <>
                        <Send className={`w-5 h-5 ${assignment?.status === 'passed' ? "" : "group-hover:translate-x-1 group-hover:-translate-y-1"} transition-transform`} />
                        {assignment?.status === 'passed' ? "Module Validated" : assignment ? "Resubmit Solution" : "Commit Pull Request"}
                      </>
                    )}
                  </button>
                </form>
              </div>

              <div className="space-y-8">
                <div className="bg-card border border-border rounded-3xl p-8 flex flex-col">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-6 underline decoration-border underline-offset-4">Module Inventory</h4>
                  <div className="flex-1 space-y-3">
                    {(week.materials && week.materials.length > 0) ? (
                      week.materials.map((doc, idx) => (
                        <a key={idx} href={doc.url} target="_blank" className="flex items-center justify-between p-4 bg-background/50 border border-border/50 rounded-2xl hover:border-yellow-500/40 transition-all group">
                          <span className="text-xs text-muted-foreground group-hover:text-yellow-500 transition-colors font-bold tracking-tight underline decoration-transparent group-hover:decoration-yellow-500/30">{doc.title}</span>
                          <div className="text-muted-foreground/40 group-hover:text-yellow-500 transition-all">
                            <ExternalLink className="w-3 h-3" />
                          </div>
                        </a>
                      ))
                    ) : (
                      <div className="py-8 text-center border border-dashed border-border rounded-2xl">
                        <p className="text-[10px] text-muted-foreground/60 uppercase font-bold">No Supplementary Intel</p>
                      </div>
                    )}
                  </div>
                </div>

                {week.transcript && (
                  <div className="bg-card border border-border rounded-3xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Session Transcript</h4>
                      <button 
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="text-[10px] font-bold text-yellow-500 hover:text-yellow-400 flex items-center gap-2 transition-colors uppercase tracking-widest"
                      >
                        {showTranscript ? <><EyeOff className="w-3 h-3" /> Hide Log</> : <><Eye className="w-3 h-3" /> Reveal Details</>}
                      </button>
                    </div>
                    {showTranscript && (
                      <div className="p-4 bg-background border border-border rounded-xl max-h-[300px] overflow-y-auto scrollbar-hide">
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium whitespace-pre-wrap">
                          {week.transcript}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }
