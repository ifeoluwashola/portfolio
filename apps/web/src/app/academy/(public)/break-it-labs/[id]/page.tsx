"use client";
import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { 
  Terminal, 
  ChevronLeft, 
  ShieldAlert, 
  Lock, 
  Send, 
  MessageSquare, 
  Trophy, 
  CheckCircle2, 
  User,
  Clock,
  ExternalLink,
  Code2,
  Zap,
  ChevronRight
} from "lucide-react";
import { getAcademySession, submitLabFix, addLabComment, getStudentStatus, logout } from "../../../actions";
import { AlertModal } from "../../../../../components/AlertModal";

interface SubmissionComment {
  id: number;
  student_name: string;
  body: string;
  created_at: string;
}

interface LabSubmission {
  id: number;
  student_id: string;
  student_name: string;
  proposed_fix: string;
  is_winner: boolean;
  comments: SubmissionComment[];
  created_at: string;
}

interface BreakItLab {
  id: number;
  title: string;
  scenario: string;
  broken_code: string;
  status: 'active' | 'solved' | 'archived';
  submissions: LabSubmission[];
  created_at: string;
}

export default function LabDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [lab, setLab] = useState<BreakItLab | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [studentStatus, setStudentStatus] = useState<string>("active");
  const [newFix, setNewFix] = useState("");
  const [commentingOn, setCommentingOn] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [modal, setModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "warning" as "error" | "warning" | "success",
    onConfirm: undefined as (() => void) | undefined
  });

  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

  const fetchLab = useCallback(async () => {
    try {
      const res = await fetch(`${apiBase}/v1/labs/${id}`);
      if (!res.ok) throw new Error("Lab not found");
      const data = await res.json();
      setLab(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [apiBase, id]);

  useEffect(() => {
    getAcademySession().then(setIsAuthenticated);
    getStudentStatus().then(res => {
      if (res.status) setStudentStatus(res.status);
    });
    fetchLab();
  }, [id, fetchLab]);

  const showAlert = (title: string, message: string, type: "error" | "warning" | "success" = "warning", onConfirm?: () => void) => {
    setModal({ isOpen: true, title, message, type, onConfirm });
  };

  const handleRevokedAccess = () => {
    showAlert(
      "Access Revoked", 
      "Your academic standing has been downgraded to DISQUALIFIED. You have been restricted from all interactive environments. Please contact the Office of student Affairs.", 
      "error",
      () => logout()
    );
  };

  const handleSubmitFix = async () => {
    if (!newFix.trim()) return;
    if (studentStatus === "disqualified") { handleRevokedAccess(); return; }

    setSubmitting(true);
    try {
      const res = await submitLabFix(id, newFix);
      if (res.error) {
        if (res.error.includes("revoked")) { handleRevokedAccess(); return; }
        throw new Error(res.error);
      }
      setNewFix("");
      fetchLab();
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      showAlert("System Error", msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddComment = async (subID: number) => {
    if (!newComment.trim()) return;
    if (studentStatus === "disqualified") { handleRevokedAccess(); return; }

    try {
      const res = await addLabComment(subID, newComment);
      if (res.error) {
        if (res.error.includes("revoked")) { handleRevokedAccess(); return; }
        throw new Error(res.error);
      }
      setNewComment("");
      setCommentingOn(null);
      fetchLab();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Comment failed";
      showAlert("System Error", msg, "error");
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center font-mono text-yellow-500">
      _auditing_environment...
    </div>
  );
  if (!lab) return (
    <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground font-mono">
      FAIL: lab_not_found
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-yellow-500/30 font-mono pb-20">

      {/* Detail Header */}
      <div className="bg-background/80 backdrop-blur-md border-b border-border z-40">
        <div className="max-w-5xl mx-auto px-6 py-6">
          <Link
            href="/academy/break-it-labs"
            className="inline-flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest hover:text-yellow-500 transition-colors mb-4"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Labs
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight uppercase flex items-center gap-3">
                <span className="text-yellow-500">{">_"}</span> {lab.title}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest flex items-center gap-2">
                  <Clock className="w-3 h-3" /> Deployed {new Date(lab.created_at).toLocaleDateString()}
                </span>
                <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${
                  lab.status === 'active'
                    ? 'text-emerald-500 border-emerald-500/20 bg-emerald-500/5'
                    : 'text-muted-foreground border-border bg-card'
                }`}>
                  Environment: {lab.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-12">

        {/* ── Left Column: Scenario & Code ── */}
        <div className="lg:col-span-2 space-y-12">

          {/* Scenario */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/60 mb-6 flex items-center gap-3">
              <ShieldAlert className="w-4 h-4 text-yellow-500" /> Scenario Outline
            </h2>
            <div className="text-foreground/70 dark:text-muted-foreground leading-relaxed text-sm">
              {lab.scenario}
            </div>
          </section>

          {/* Broken Code */}
          <section>
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/60 mb-6 flex items-center gap-3">
              <Code2 className="w-4 h-4 text-yellow-500" /> Broken System Architecture
            </h2>
            <div className="relative group">
              <div className="absolute top-4 right-4 text-[9px] font-bold text-muted-foreground/50 bg-card/50 px-2 py-1 rounded border border-border uppercase group-hover:text-red-500 transition-colors z-10">
                Read-Only
              </div>
              <pre className="bg-card/50 border border-border rounded-2xl p-6 text-xs text-red-500 dark:text-red-300 overflow-x-auto leading-relaxed scrollbar-hide">
                <code>{lab.broken_code}</code>
              </pre>
            </div>
          </section>

          {/* Submission Area */}
          <section className="pt-12 border-t border-border">
            {isAuthenticated ? (
              <div className="space-y-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-yellow-500" /> Proposed Fix_
                </h2>
                <p className="text-xs text-muted-foreground">
                  Existing solutions for this lab will be overwritten (GitHub Force Push Strategy).
                </p>
                <textarea
                  value={newFix}
                  onChange={(e) => setNewFix(e.target.value)}
                  rows={6}
                  disabled={studentStatus === "disqualified"}
                  className="w-full bg-card border border-border rounded-2xl p-6 font-mono text-sm text-emerald-600 dark:text-emerald-400 focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder:text-muted-foreground/30 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder={
                    studentStatus === "disqualified"
                      ? "ACCESS_REVOKED: Submission terminal disabled by administrative order."
                      : "Paste your optimized kubernetes manifest or bash fix here..."
                  }
                />
                <button
                  onClick={handleSubmitFix}
                  disabled={submitting || !newFix.trim() || studentStatus === "disqualified"}
                  className="bg-yellow-500 text-slate-950 px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all shadow-[0_0_20px_rgba(234,179,8,0.1)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
                >
                  {studentStatus === "disqualified" ? "Awaiting Review" : "Deploy Fix to Repository"} <Send className="w-3 h-3" />
                </button>

                {showSuccess && (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-500 rounded-xl p-4 text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4" /> Environment Updated: Fix deployed to staging. Awaiting peer review_
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-3xl p-10 text-center space-y-6 relative overflow-hidden">
                <Lock className="w-10 h-10 text-yellow-500 mx-auto mb-2 opacity-50" />
                <h3 className="text-2xl font-bold tracking-tight">Submission Locked_</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  These technical labs are exclusive to Kybern Academy students. Enrolled members can submit fixes and receive peer code reviews.
                </p>
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-3 bg-yellow-500 text-slate-950 px-8 py-3 rounded-xl font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all"
                >
                  Join Academy Cohort 2 <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </section>

          {/* Peer Reviews Thread */}
          <section className="pt-20 space-y-8">
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] text-muted-foreground/60 flex items-center gap-3">
              <MessageSquare className="w-4 h-4 text-yellow-500" /> Pull Request History ({lab.submissions?.length || 0})
            </h2>

            <div className="space-y-12">
              {lab.submissions?.map((sub) => (
                <div
                  key={sub.id}
                  className={`bg-card/10 border rounded-3xl overflow-hidden transition-all relative ${
                    sub.is_winner ? "border-yellow-500/30" : "border-border"
                  }`}
                >
                  {sub.is_winner && (
                    <div className="absolute top-0 right-0 p-2 z-10">
                      <div className="bg-yellow-500 text-slate-950 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-lg">
                        <Trophy className="w-2.5 h-2.5" /> Verified Fix
                      </div>
                    </div>
                  )}

                  {/* PR Header */}
                  <div className="p-6 border-b border-border flex items-center justify-between bg-card/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center border border-border">
                        <User className="w-5 h-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          {sub.student_name}{" "}
                          <span className="text-muted-foreground/50 font-normal">wants to merge fixes</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 uppercase tracking-widest">
                          SUBMISSION_REF: {sub.id.toString().padStart(4, '0')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* PR Code */}
                  <div className="p-6">
                    <pre className="bg-background rounded-2xl p-6 text-[11px] font-mono text-emerald-600 dark:text-emerald-400 overflow-x-auto border border-border leading-relaxed">
                      <code>{sub.proposed_fix}</code>
                    </pre>
                  </div>

                  {/* PR Comments Thread */}
                  <div className="bg-muted/20 px-6 py-8 border-t border-border space-y-6">
                    {sub.comments && sub.comments.length > 0 ? (
                      <div className="space-y-6">
                        {sub.comments.map((comment) => (
                          <div key={comment.id} className="flex gap-4">
                            <div className="w-6 h-6 rounded bg-muted flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-foreground">
                              {comment.student_name[0]}
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold text-yellow-500/80 uppercase tracking-widest">
                                  {comment.student_name}
                                </span>
                                <span className="text-[9px] text-muted-foreground/50">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="p-3 bg-card/50 rounded-xl border border-border/50 text-xs text-foreground/70 dark:text-muted-foreground leading-relaxed">
                                {comment.body}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-muted-foreground/50 italic uppercase tracking-widest text-center py-4">
                        No reviews yet_
                      </p>
                    )}

                    {/* Comment Input */}
                    {isAuthenticated ? (
                      <div className="pt-6 border-t border-border/50">
                        {commentingOn === sub.id ? (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                            <textarea
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              rows={3}
                              disabled={studentStatus === "disqualified"}
                              className="w-full bg-background border border-border rounded-xl p-4 text-[11px] text-foreground focus:ring-1 focus:ring-yellow-500/50 outline-none transition-all placeholder:text-muted-foreground/30 disabled:opacity-50"
                              placeholder={
                                studentStatus === "disqualified"
                                  ? "Comments restricted."
                                  : "Add your technical review or suggest improvements..."
                              }
                            />
                            <div className="flex justify-end gap-3">
                              <button
                                onClick={() => setCommentingOn(null)}
                                className="px-4 py-2 text-[9px] font-bold text-muted-foreground uppercase hover:text-foreground transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleAddComment(sub.id)}
                                className="bg-yellow-500 text-slate-950 px-4 py-2 rounded text-[9px] font-bold uppercase tracking-widest hover:bg-yellow-400 transition-all"
                              >
                                Post Review
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setCommentingOn(sub.id)}
                            className="w-full bg-card/50 border border-border rounded-xl py-3 text-[10px] font-bold text-muted-foreground hover:text-yellow-500 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                          >
                            <MessageSquare className="w-3 h-3" /> Review Code_
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="pt-6 border-t border-border/50 text-center">
                        <Link
                          href="/academy/login"
                          className="text-[10px] font-bold text-muted-foreground hover:text-yellow-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                        >
                          <Lock className="w-3 h-3" /> Sign in to start review
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* ── Right Column: Lab Meta ── */}
        <div className="space-y-8">
          <div className="bg-card/30 border border-border rounded-3xl p-8 sticky top-32">
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Lab Rules
            </h3>
            <ul className="space-y-6">
              {[
                "Only one active fix permitted per student. Force push strategy is active.",
                "Verified winners will be immortalized in the lab history as Lead Architects.",
                "Spamming review threads will result in academic suspension.",
              ].map((rule, i) => (
                <li key={i} className="flex gap-4">
                  <div className="w-5 h-5 bg-yellow-500/10 rounded flex items-center justify-center text-[10px] font-bold text-yellow-500 flex-shrink-0">
                    {i + 1}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed uppercase tracking-tighter">
                    {rule}
                  </p>
                </li>
              ))}
            </ul>
            <div className="mt-12 pt-8 border-t border-border">
              <p className="text-[10px] font-bold text-muted-foreground/50 uppercase mb-4 tracking-widest">Share Scenario</p>
              <div className="flex gap-4">
                <button className="text-muted-foreground hover:text-yellow-500 transition-colors">
                  <Terminal className="w-4 h-4" />
                </button>
                <button className="text-muted-foreground hover:text-yellow-500 transition-colors">
                  <Zap className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Enrollment CTA for Public Students */}
      {!isAuthenticated && (
        <div className="max-w-5xl mx-auto px-6 mt-32">
          <div className="bg-gradient-to-br from-yellow-500/10 to-card border border-yellow-500/20 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none" />
            <div className="relative z-10">
              <h2 className="text-3xl font-bold mb-4 tracking-tighter uppercase">
                Enjoyed this <span className="text-yellow-500">scenario?</span>
              </h2>
              <p className="text-muted-foreground text-[10px] max-w-sm mx-auto mb-10 leading-relaxed uppercase tracking-[0.3em]">
                This is just the tip of the iceberg. Join the full mentorship program to master these environments end-to-end.
              </p>
              <Link
                href="/academy#apply"
                className="inline-flex items-center gap-3 bg-yellow-500 text-slate-950 px-10 py-4 rounded-xl font-bold text-xs uppercase tracking-[0.2em] hover:bg-yellow-400 transition-all shadow-[0_0_40px_rgba(234,179,8,0.2)]"
              >
                $ Enroll_Now <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={modal.isOpen}
        onClose={() => setModal({ ...modal, isOpen: false })}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onConfirm={modal.onConfirm}
      />
    </div>
  );
}
