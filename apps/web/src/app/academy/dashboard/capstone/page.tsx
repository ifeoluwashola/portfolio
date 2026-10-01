"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  Send, 
  Github, 
  Globe, 
  Layers, 
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ShieldCheck,
  XCircle,
  ArrowLeft,
  ExternalLink,
  Linkedin,
  Clock,
  Sparkles,
  Trophy,
  Upload,
  Pencil,
  Eye,
  CheckSquare,
  RotateCcw,
  MessageSquare,
  AlertTriangle,
  Calendar,
  Timer
} from "lucide-react";
import { 
  submitCapstone, 
  getStudentCapstone, 
  getStudentProfile, 
  getS3UploadUrl, 
  getDownloadUrl,
  respondToCapstone
} from "@/app/academy/actions";

interface Capstone {
  id: number;
  project_title: string;
  description: string;
  architecture_diagram_url: string;
  live_demo_url: string;
  repo_url: string;
  status: string;
  feedback?: string;
  student_comment?: string;
  student_name?: string;
  student_linkedin?: string;
  student_github?: string;
  alumni_slug?: string;
  created_at?: string;
  updated_at?: string;
}

// Strict Capstone Deadline: October 21, 2026 at 11:59:59 PM WAT (UTC+1)
const CAPSTONE_DEADLINE_MS = new Date("2026-10-21T23:59:59+01:00").getTime();

export default function CapstoneSubmissionPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [capstone, setCapstone] = useState<Capstone | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Live Deadline Countdown state
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
  }>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isExpired: false,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = CAPSTONE_DEADLINE_MS - Date.now();
      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isExpired: false,
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Student Quick Response state (for responding directly to admin feedback)
  const [quickResponse, setQuickResponse] = useState("");
  const [sendingResponse, setSendingResponse] = useState(false);
  
  // Diagram file upload state
  const [uploadingDiagram, setUploadingDiagram] = useState(false);
  const [diagramPreviewUrl, setDiagramPreviewUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    project_title: "",
    description: "",
    architecture_diagram_url: "",
    live_demo_url: "",
    repo_url: "",
    linkedin_url: "",
    github_url: "",
    student_comment: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, []);


  const fetchInitialData = async () => {
    setInitialLoading(true);
    try {
      const [capRes, profileRes] = await Promise.all([
        getStudentCapstone(),
        getStudentProfile()
      ]);

      const capData = (capRes && "data" in capRes && capRes.data) ? (capRes.data as Capstone) : null;
      const profile = (profileRes && !("error" in profileRes)) ? profileRes : null;

      if (capData) {
        setCapstone(capData);
        if (capData.architecture_diagram_url) {
          setDiagramPreviewUrl(capData.architecture_diagram_url);
        }
        setFormData({
          project_title: capData.project_title || "",
          description: capData.description || "",
          architecture_diagram_url: capData.architecture_diagram_url || "",
          live_demo_url: capData.live_demo_url || "",
          repo_url: capData.repo_url || "",
          linkedin_url: capData.student_linkedin || profile?.linkedin_url || "",
          github_url: capData.student_github || profile?.github_url || "",
          student_comment: capData.student_comment || ""
        });
        // Auto-open editing if needs revision
        if (capData.status === "needs_revision") {
          setIsEditing(true);
        }
      } else {
        // Try restoring draft from localStorage
        let savedDraft: any = null;
        try {
          const raw = localStorage.getItem("kybern_capstone_draft");
          if (raw) savedDraft = JSON.parse(raw);
        } catch {}

        if (savedDraft) {
          setFormData({
            project_title: savedDraft.project_title || "",
            description: savedDraft.description || "",
            architecture_diagram_url: savedDraft.architecture_diagram_url || "",
            live_demo_url: savedDraft.live_demo_url || "",
            repo_url: savedDraft.repo_url || "",
            linkedin_url: savedDraft.linkedin_url || profile?.linkedin_url || "",
            github_url: savedDraft.github_url || profile?.github_url || "",
            student_comment: savedDraft.student_comment || ""
          });
        } else if (profile) {
          setFormData(prev => ({
            ...prev,
            linkedin_url: profile.linkedin_url || "",
            github_url: profile.github_url || ""
          }));
        }
        setIsEditing(true);
      }
    } catch (err) {
      console.error("Failed to load capstone details:", err);
      setError("Failed to load submission data. Please refresh.");
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSendQuickResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickResponse.trim()) return;
    if (timeLeft.isExpired) {
      setError("The Capstone revision deadline has passed (October 21, 2026 at 11:59 PM WAT).");
      return;
    }
    setSendingResponse(true);
    setError("");
    setSuccessMsg("");

    const res = await respondToCapstone(quickResponse.trim());
    if (res.success) {
      setSuccessMsg("Your response has been transmitted to faculty! Your Capstone status is now Resubmitted.");
      setQuickResponse("");
      const updated = await getStudentCapstone();
      if (updated && "data" in updated && updated.data) {
        setCapstone(updated.data as Capstone);
      }
    } else {
      setError(res.error || "Failed to send response to reviewer.");
    }
    setSendingResponse(false);
  };


  // Auto-save draft changes to localStorage so student work is never lost
  useEffect(() => {
    if (!initialLoading && (!capstone || capstone.status === "needs_revision") && (formData.project_title || formData.description || formData.repo_url)) {
      try {
        localStorage.setItem("kybern_capstone_draft", JSON.stringify(formData));
      } catch {}
    }
  }, [formData, initialLoading, capstone]);


  const handleDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Architecture diagram image must be smaller than 10MB");
      return;
    }

    setUploadingDiagram(true);
    setError("");

    try {
      const presign = await getS3UploadUrl(file.name, file.type);
      if ("error" in presign) {
        throw new Error(presign.error);
      }
      if (!presign.upload_url) {
        throw new Error("Failed to generate upload URL");
      }

      const res = await fetch(presign.upload_url, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!res.ok) {
        throw new Error("Failed to upload image to storage");
      }

      // Try fetching accessible download URL
      const dlUrl = await getDownloadUrl(presign.file_key);
      const cleanUrl = presign.upload_url.split("?")[0];

      if (dlUrl) {
        setDiagramPreviewUrl(dlUrl);
      }
      setFormData(prev => ({ ...prev, architecture_diagram_url: cleanUrl || dlUrl || "" }));
    } catch (err: any) {

      console.error("Upload error:", err);
      setError(err.message || "Failed to upload architecture diagram");
    } finally {
      setUploadingDiagram(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (timeLeft.isExpired) {
      setError("The Capstone submission deadline has passed (October 21, 2026 at 11:59 PM WAT). Submissions are permanently closed.");
      return;
    }
    setLoading(true);
    setError("");
    setSuccessMsg("");


    // URL validations
    try {
      new URL(formData.repo_url);
    } catch {
      setError("Please enter a valid GitHub Repository URL");
      setLoading(false);
      return;
    }

    try {
      new URL(formData.live_demo_url);
    } catch {
      setError("Please enter a valid Live Demo URL");
      setLoading(false);
      return;
    }

    try {
      new URL(formData.architecture_diagram_url);
    } catch {
      setError("Please provide a valid Architecture Diagram URL or upload an image");
      setLoading(false);
      return;
    }

    const res = await submitCapstone(formData);
    if (res.success) {
      try {
        localStorage.removeItem("kybern_capstone_draft");
      } catch {}
      setSuccessMsg("Your Capstone Project has been submitted for faculty audit!");
      setIsEditing(false);
      // Reload updated data
      const updated = await getStudentCapstone();
      if (updated && "data" in updated && updated.data) {
        setCapstone(updated.data as Capstone);
      }
    } else {
      if (res.error?.includes("Unauthorized") || res.error?.includes("session")) {
        setError("Your session has timed out. Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/academy/login";
        }, 1500);
        return;
      }
      setError(res.error || "Failed to submit capstone. Please try again.");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-4">
        <Loader2 className="animate-spin text-yellow-500" size={36} />
        <span className="text-sm font-mono tracking-wider">Verifying graduation audit credentials...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-20">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between gap-4">
        <Link 
          href="/academy/dashboard"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-yellow-500 transition-colors"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>

        {capstone && (
          <div className="flex items-center gap-2">
            {capstone.status === "approved" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-500">
                <ShieldCheck size={14} /> Certified Graduate
              </span>
            ) : capstone.status === "needs_revision" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-400">
                <AlertCircle size={14} /> Changes Required
              </span>
            ) : capstone.status === "resubmitted" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <RotateCcw size={14} /> Resubmitted — In Review
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-500">
                <Clock size={14} /> Under Review
              </span>
            )}
          </div>
        )}
      </div>

      {/* DEADLINE CUTOFF & COUNTDOWN BANNER */}
      <div className={`relative overflow-hidden rounded-3xl border-2 transition-all p-6 sm:p-8 ${
        timeLeft.isExpired
          ? "bg-gradient-to-r from-red-950/40 via-red-900/20 to-background border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.15)]"
          : "bg-gradient-to-r from-amber-950/30 via-yellow-950/20 to-background border-yellow-500/40 shadow-[0_0_30px_rgba(234,179,8,0.1)]"
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                timeLeft.isExpired
                  ? "bg-red-500/20 text-red-400 border border-red-500/30"
                  : "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
              }`}>
                {timeLeft.isExpired ? (
                  <>
                    <XCircle size={12} /> Submission Window Closed
                  </>
                ) : (
                  <>
                    <AlertTriangle size={12} className="animate-pulse" /> Critical Graduation Cutoff
                  </>
                )}
              </span>
              <span className="text-xs font-mono text-muted-foreground flex items-center gap-1.5">
                <Calendar size={13} className="text-yellow-500" /> October 21, 2026 &bull; 11:59 PM WAT
              </span>
            </div>

            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <span>Capstone Submission Deadline:</span>
                <span className={timeLeft.isExpired ? "text-red-400" : "text-yellow-500"}>
                  21st October, 11:59 PM WAT
                </span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mt-1.5">
                The Capstone submission portal closes strictly at <strong className="text-foreground">11:59 PM WAT on 21st October</strong>. 
                After this deadline, students will <span className="text-red-400 font-semibold">no longer be able to submit or revise</span> their capstone. 
                Failure to submit by the deadline means you <strong className="text-foreground">cannot graduate with this cohort</strong> and will <span className="text-red-400 font-semibold">not be published to the Alumni page</span>.
              </p>
            </div>
          </div>

          {/* Countdown Clock / Locked Box */}
          <div className="shrink-0 bg-background/80 backdrop-blur border border-border/80 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center min-w-[280px]">
            {timeLeft.isExpired ? (
              <div className="text-center space-y-1 py-2">
                <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-500 mb-2">
                  <XCircle size={22} />
                </div>
                <div className="text-sm font-black text-red-400 uppercase tracking-wider">Submissions Closed</div>
                <div className="text-[11px] text-muted-foreground">Cutoff Passed (Oct 21, 11:59 PM WAT)</div>
              </div>
            ) : (
              <div className="space-y-2 w-full">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Timer size={12} className="text-yellow-500" /> Time Remaining
                  </span>
                  <span className="text-yellow-500 font-mono">WAT (UTC+1)</span>
                </div>
                <div className="grid grid-cols-4 gap-2 text-center">
                  <div className="bg-card border border-border rounded-xl p-2 sm:p-2.5">
                    <span className="block text-xl sm:text-2xl font-black text-foreground font-mono">
                      {String(timeLeft.days).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Days
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-2 sm:p-2.5">
                    <span className="block text-xl sm:text-2xl font-black text-foreground font-mono">
                      {String(timeLeft.hours).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Hours
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-2 sm:p-2.5">
                    <span className="block text-xl sm:text-2xl font-black text-foreground font-mono">
                      {String(timeLeft.minutes).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Mins
                    </span>
                  </div>
                  <div className="bg-card border border-border rounded-xl p-2 sm:p-2.5">
                    <span className="block text-xl sm:text-2xl font-black text-yellow-500 font-mono">
                      {String(timeLeft.seconds).padStart(2, "0")}
                    </span>
                    <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground mt-0.5">
                      Secs
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Header Banner */}
      <div className="relative bg-card border border-border rounded-3xl p-8 sm:p-10 overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 text-foreground pointer-events-none">
          <GraduationCap className="w-64 h-64 -mr-12 -mt-12" />
        </div>

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-500 text-[10px] font-bold tracking-widest uppercase">
            <Sparkles size={12} /> Kybern Mentorship Final Phase
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
            <GraduationCap className="text-yellow-500 w-9 h-9" />
            Capstone Project &amp; Graduation PR
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            The Capstone Project is the defining engineering achievement of your Kybern journey. 
            Submit your production-ready Infrastructure as Code, live deployment URL, and comprehensive architectural design for faculty evaluation. 
            Once approved, you will be officially inducted into the <strong className="text-foreground">Alumni Hall of Fame</strong> with a verified public portfolio.
          </p>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 p-5 rounded-2xl flex items-center gap-3 font-semibold text-sm">
          <CheckCircle2 size={20} className="shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* APPROVED STATE BANNER */}
      {capstone && capstone.status === "approved" && (
        <div className="bg-gradient-to-br from-emerald-950/30 via-emerald-900/10 to-background border-2 border-emerald-500/40 p-8 rounded-3xl shadow-[0_0_40px_rgba(16,185,129,0.1)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shadow-inner">
                <Trophy size={32} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500">Certified Kybern Alumni</span>
                <h2 className="text-2xl font-black text-foreground tracking-tight">Congratulations! Capstone Approved</h2>
                <p className="text-muted-foreground text-sm mt-0.5">Your project meets all cloud native production readiness standards.</p>
              </div>
            </div>

            {capstone.alumni_slug && (
              <Link
                href={`/academy/alumni/${capstone.alumni_slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.25)] shrink-0"
              >
                View Public Portfolio
                <ExternalLink size={16} />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* NEEDS REVISION BANNER WITH INTERACTIVE QUICK RESPONSE */}
      {capstone && capstone.status === "needs_revision" && (
        <div className="bg-orange-950/20 border-2 border-orange-500/40 p-8 rounded-3xl space-y-6 shadow-[0_0_30px_rgba(249,115,22,0.1)]">
          <div className="flex items-center gap-3 text-orange-400">
            <AlertCircle size={26} />
            <div>
              <h3 className="text-xl font-bold tracking-tight text-white">Faculty Audit: Changes Requested</h3>
              <p className="text-xs text-orange-400/80">Your capstone remains in the graduation queue while adjustments or clarifications are provided.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-400">Reviewer Feedback:</span>
            <div className="bg-background/80 border border-orange-900/40 p-5 rounded-2xl text-orange-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
              {capstone.feedback || "Please review reviewer comments and update your submission."}
            </div>
          </div>

          {/* Quick Response Form to Faculty */}
          <div className="bg-card border border-border/70 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-foreground font-bold text-sm">
              <MessageSquare className="w-4 h-4 text-yellow-500" />
              <span>Respond or Send Follow-Up Note to Reviewer</span>
            </div>
            {timeLeft.isExpired ? (
              <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/40 text-red-400 text-xs flex items-center gap-2.5">
                <XCircle size={18} className="shrink-0 text-red-500" />
                <span>
                  <strong>Revision Window Closed:</strong> The deadline of October 21 at 11:59 PM WAT has expired. Faculty audit submissions and responses are now locked.
                </span>
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">
                  If you have questions, clarifications, or have made adjustments to your repository/live demo, send a message directly back to the faculty committee:
                </p>
                <form onSubmit={handleSendQuickResponse} className="space-y-3">
                  <textarea
                    required
                    rows={3}
                    value={quickResponse}
                    onChange={(e) => setQuickResponse(e.target.value)}
                    placeholder="e.g. 'I have updated the Kubernetes manifests to include PodDisruptionBudgets and fixed the live demo ingress certificate as requested...'"
                    className="w-full bg-background border border-border rounded-xl p-3.5 text-xs text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 resize-none leading-relaxed"
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-[11px] text-muted-foreground">
                      Sending a response automatically flips your Capstone status to <strong className="text-blue-400 font-medium">Resubmitted</strong> in the admin graduation queue.
                    </p>
                    <button
                      type="submit"
                      disabled={sendingResponse || !quickResponse.trim()}
                      className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {sendingResponse ? (
                        <>
                          <Loader2 size={14} className="animate-spin" /> Sending...
                        </>
                      ) : (
                        <>
                          <Send size={14} /> Send Response
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {!timeLeft.isExpired && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-orange-900/30">
              <Pencil size={12} className="text-yellow-500" />
              <span>
                Need to modify your links, description, or diagram? Edit the fields below and click <strong>&quot;Resubmit Capstone PR&quot;</strong>.
              </span>
            </div>
          )}
        </div>
      )}

      {/* RESUBMITTED AUDIT STATE BANNER */}
      {capstone && capstone.status === "resubmitted" && !isEditing && (
        <div className="bg-blue-950/20 border border-blue-500/30 p-8 rounded-3xl space-y-6 shadow-[0_0_30px_rgba(59,130,246,0.1)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-white">Capstone PR Resubmitted</h3>
                <p className="text-sm text-slate-400">Your follow-up response and updates are in the active graduation review queue.</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-border hover:border-yellow-500/40 text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all shrink-0"
            >
              <Pencil size={14} /> Edit Submission
            </button>
          </div>

          {/* Conversation history */}
          <div className="space-y-3 pt-2 border-t border-blue-900/30">
            {capstone.student_comment && (
              <div className="bg-background/80 border border-blue-500/20 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Your Latest Note to Reviewer:</span>
                <p className="text-xs text-blue-200/90 italic">&ldquo;{capstone.student_comment}&rdquo;</p>
              </div>
            )}
            {capstone.feedback && (
              <div className="bg-background/80 border border-border/40 rounded-xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Previous Reviewer Feedback:</span>
                <p className="text-xs text-muted-foreground">{capstone.feedback}</p>
              </div>
            )}
          </div>

          {/* Submission Details Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Project Title</span>
              <p className="font-bold text-foreground">{capstone.project_title}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Last Updated</span>
              <p className="text-foreground">{capstone.updated_at ? new Date(capstone.updated_at).toLocaleDateString() : "Recently"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Repository URL</span>
              <a href={capstone.repo_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 font-mono text-xs flex items-center gap-1 hover:underline">
                <Github size={12} /> {capstone.repo_url}
              </a>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Live Demo URL</span>
              <a href={capstone.live_demo_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 font-mono text-xs flex items-center gap-1 hover:underline">
                <Globe size={12} /> {capstone.live_demo_url}
              </a>
            </div>
          </div>
        </div>
      )}

      {/* PENDING AUDIT STATE */}
      {capstone && capstone.status === "pending" && !isEditing && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-8 rounded-3xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Clock size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Capstone PR Under Review</h3>
                <p className="text-sm text-muted-foreground">Your submission is currently in the active audit queue. Faculty review takes 48–72 hours.</p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-background border border-border hover:border-yellow-500/40 text-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
            >
              <Pencil size={14} /> Update Submission
            </button>
          </div>

          {/* Student Note if present */}
          {capstone.student_comment && (
            <div className="bg-background/80 border border-border/40 rounded-xl p-4 space-y-1 text-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Your Submission Note:</span>
              <p className="text-muted-foreground italic">&ldquo;{capstone.student_comment}&rdquo;</p>
            </div>
          )}

          {/* Submission Details Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border/50 text-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Project Title</span>
              <p className="font-bold text-foreground">{capstone.project_title}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Submitted Date</span>
              <p className="text-foreground">{capstone.created_at ? new Date(capstone.created_at).toLocaleDateString() : "Recently"}</p>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Repository URL</span>
              <a href={capstone.repo_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 font-mono text-xs flex items-center gap-1 hover:underline">
                <Github size={12} /> {capstone.repo_url}
              </a>
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Live Demo URL</span>
              <a href={capstone.live_demo_url} target="_blank" rel="noopener noreferrer" className="text-yellow-500 font-mono text-xs flex items-center gap-1 hover:underline">
                <Globe size={12} /> {capstone.live_demo_url}
              </a>
            </div>
          </div>

          {capstone.architecture_diagram_url && (
            <div className="pt-4 border-t border-border/50 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Architecture Diagram</span>
              <div className="rounded-2xl border border-border overflow-hidden bg-background max-h-80 flex items-center justify-center p-2">
                <img 
                  src={capstone.architecture_diagram_url} 
                  alt="Architecture Diagram" 
                  className="max-h-72 object-contain rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* AUDIT CRITERIA CHECKLIST */}
      <div className="bg-card/50 border border-border rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-5 h-5 text-yellow-500" />
          <h3 className="text-base font-bold text-foreground uppercase tracking-tight">Faculty Audit Criteria</h3>
        </div>
        <p className="text-xs text-muted-foreground">Ensure your Capstone project fulfills each high-stakes production requirement prior to submission:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {[
            {
              title: "1. Infrastructure as Code",
              desc: "All cloud resources defined via Terraform/Helm/Kubernetes manifests with modular structure."
            },
            {
              title: "2. Cloud Resilience & HA",
              desc: "Multi-AZ topology, autoscaling policies, container health probes, and self-healing pods."
            },
            {
              title: "3. CI/CD Pipeline Automation",
              desc: "Automated linting, test suites, container image builds, vulnerability scans, and continuous deployment."
            },
            {
              title: "4. Observability & Logging",
              desc: "Structured application logs, Prometheus metric scrapers, and alerting or dashboards configured."
            }
          ].map((item, idx) => (
            <div key={idx} className="p-4 bg-background border border-border/60 rounded-2xl space-y-1">
              <h4 className="text-xs font-bold text-yellow-500 uppercase tracking-wide">{item.title}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CAPSTONE FORM (Shown when editing or unsubmitted or needs revision) */}
      {(isEditing || !capstone || capstone.status === "needs_revision") && (
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 sm:p-10 space-y-8">
          <div className="flex items-center justify-between pb-6 border-b border-border/60">
            <div>
              <h2 className="text-xl font-bold text-foreground tracking-tight">
                {capstone?.status === "needs_revision" 
                  ? "Resubmit Capstone PR" 
                  : capstone?.status === "resubmitted"
                  ? "Update Resubmitted Capstone PR"
                  : capstone 
                  ? "Update Capstone PR Details" 
                  : "New Capstone PR Submission"}
              </h2>
              <p className="text-xs text-muted-foreground">Complete each field accurately. Markdown formatting is supported in the walkthrough.</p>
            </div>

            {capstone && (capstone.status === "pending" || capstone.status === "resubmitted") && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Cancel Editing
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Column: Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <FileText size={14} className="text-yellow-500" /> Project Title
                </label>
                <input 
                  required
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-medium text-sm"
                  placeholder="e.g. Distributed Fintech Transaction Gateway on AWS EKS"
                  value={formData.project_title}
                  onChange={(e) => setFormData({...formData, project_title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Layers size={14} className="text-yellow-500" /> Architecture Walkthrough &amp; Decisions
                </label>
                <textarea 
                  required
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 min-h-[220px] resize-none leading-relaxed text-sm"
                  placeholder="Explain your architectural decisions, tools used (Terraform, ArgoCD, Docker, Prometheus), disaster recovery strategy, and security model..."
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground">Markdown supported. Minimum 100 words recommended.</p>
              </div>

              {/* Socials for Alumni Profile */}
              <div className="pt-4 border-t border-border/50 space-y-4">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">
                  Alumni Profile Verification
                </p>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Linkedin size={14} className="text-blue-500" /> LinkedIn Profile URL
                  </label>
                  <input 
                    type="url"
                    className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none text-xs font-mono placeholder:text-muted-foreground/30"
                    placeholder="https://linkedin.com/in/username"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({...formData, linkedin_url: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
                    <Github size={14} className="text-foreground" /> Personal GitHub Profile URL
                  </label>
                  <input 
                    type="url"
                    className="w-full bg-background border border-border rounded-xl p-3 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none text-xs font-mono placeholder:text-muted-foreground/30"
                    placeholder="https://github.com/username"
                    value={formData.github_url}
                    onChange={(e) => setFormData({...formData, github_url: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Artifacts & Deployment */}
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Github size={14} className="text-yellow-500" /> GitHub Repository URL
                </label>
                <input 
                  required
                  type="url"
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-xs"
                  placeholder="https://github.com/your-org/capstone-repo"
                  value={formData.repo_url}
                  onChange={(e) => setFormData({...formData, repo_url: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground">Must contain all IaC configs, Kubernetes manifests, and application source.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                  <Globe size={14} className="text-yellow-500" /> Live Demo URL
                </label>
                <input 
                  required
                  type="url"
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-xs"
                  placeholder="https://capstone.yourdomain.com"
                  value={formData.live_demo_url}
                  onChange={(e) => setFormData({...formData, live_demo_url: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground">Publicly reachable URL (Ingress, CloudFront, LoadBalancer, etc.).</p>
              </div>

              {/* Architecture Diagram URL & File Upload */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Layers size={14} className="text-yellow-500" /> Architecture Diagram
                  </label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingDiagram}
                    className="inline-flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 font-bold uppercase tracking-wider"
                  >
                    {uploadingDiagram ? (
                      <>
                        <Loader2 size={12} className="animate-spin" /> Uploading...
                      </>
                    ) : (
                      <>
                        <Upload size={12} /> Upload Image
                      </>
                    )}
                  </button>
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleDiagramUpload}
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="hidden"
                  />
                </div>

                <input 
                  required
                  type="url"
                  className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-xs"
                  placeholder="Paste direct image URL or click 'Upload Image'"
                  value={formData.architecture_diagram_url}
                  onChange={(e) => setFormData({...formData, architecture_diagram_url: e.target.value})}
                />
                <p className="text-[11px] text-muted-foreground">Lucidchart, Draw.io, Imgur, or direct S3 image link.</p>

                {/* Live Diagram Preview */}
                {formData.architecture_diagram_url && (
                  <div className="mt-3 p-3 bg-background border border-border rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                      <Eye size={12} /> Diagram Preview
                    </div>
                    <div className="rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center p-2 max-h-56">
                      <img 
                        src={diagramPreviewUrl || formData.architecture_diagram_url} 
                        alt="Diagram Preview" 
                        className="max-h-52 object-contain rounded-lg"
                        onError={(e) => {
                          // Hide broken image placeholder
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />

                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note / Comment to Reviewer */}
            <div className="md:col-span-2 space-y-2 pt-2 border-t border-border/50">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <MessageSquare size={14} className="text-yellow-500" /> Student Note / Message to Reviewer (Optional)
              </label>
              <textarea 
                className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 min-h-[90px] resize-none leading-relaxed text-xs"
                placeholder="Explain any adjustments made, answer reviewer questions, or provide specific instructions for testing your live deployment..."
                value={formData.student_comment}
                onChange={(e) => setFormData({...formData, student_comment: e.target.value})}
              />
              <p className="text-[11px] text-muted-foreground">This note will appear directly in the reviewer&apos;s graduation queue card.</p>
            </div>

            {error && (
              <div className="md:col-span-2 bg-red-950/20 text-red-500 p-4 rounded-xl border border-red-900/30 flex items-center gap-3 font-medium text-sm">
                <AlertCircle size={18} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="md:col-span-2 pt-4 space-y-3">
              {timeLeft.isExpired && capstone?.status !== "approved" && (
                <div className="bg-red-950/30 border border-red-500/40 text-red-400 p-4 rounded-xl flex items-center gap-3 text-xs sm:text-sm font-medium">
                  <AlertCircle size={18} className="shrink-0 text-red-500" />
                  <span>
                    <strong>Submission Cutoff Reached:</strong> The deadline of October 21, 2026 (11:59 PM WAT) has elapsed. New submissions and updates are closed.
                  </span>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || uploadingDiagram || (timeLeft.isExpired && capstone?.status !== "approved")}
                className={`w-full font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${
                  timeLeft.isExpired && capstone?.status !== "approved"
                    ? "bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed"
                    : "bg-yellow-500 hover:bg-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(234,179,8,0.25)] hover:shadow-[0_0_35px_rgba(234,179,8,0.45)] disabled:opacity-50 disabled:cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>Transmitting to Faculty Audit Queue...</span>
                  </>
                ) : timeLeft.isExpired && capstone?.status !== "approved" ? (
                  <>
                    <XCircle size={20} />
                    <span>Submission Window Closed</span>
                  </>
                ) : (
                  <>
                    <Send size={20} />
                    <span>
                      {capstone?.status === "needs_revision" 
                        ? "Resubmit Capstone PR" 
                        : capstone?.status === "resubmitted"
                        ? "Update Resubmission"
                        : capstone 
                        ? "Save Capstone Updates" 
                        : "Submit Capstone PR"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}

    </div>
  );
}
