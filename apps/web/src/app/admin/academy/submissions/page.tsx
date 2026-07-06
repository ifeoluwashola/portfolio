"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Clock, 
  GraduationCap, 
  ExternalLink,
  MessageSquare,
  Search,
  Check,
  X,
  ChevronRight,
  Github,
  Paperclip,
  Award
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SecureFilePreview } from "@/components/ui/SecureFilePreview";

interface Assignment {
  id: string;
  student_id: string;
  student_name: string;
  week_id: number;
  week_number: number;
  github_url: string;
  status: 'pending' | 'passed' | 'failed';
  score?: number | null;
  admin_feedback?: string;
  created_at: string;
  submission_file_keys?: string[];
}

export default function SubmissionsHub() {
  const [submissions, setSubmissions] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSub, setGradingSub] = useState<Assignment | null>(null);
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<string>("");
  const [isGrading, setIsGrading] = useState(false);

  const fetchSubmissions = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/proxy/v1/admin/academy/submissions");
      if (res.ok) {
        const data = await res.json();
        setSubmissions(data || []);
      }
    } catch (err) {
      console.error("Failed to fetch submissions", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubmissions();
  }, [fetchSubmissions]);

  async function handleGradeSubmission(status: 'passed' | 'failed') {
    if (!gradingSub) return;
    setIsGrading(true);
    
    try {
      const scoreValue = score !== "" ? parseInt(score, 10) : null;
      
      const res = await fetch("/api/admin/proxy/v1/admin/academy/submissions/grade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assignment_id: gradingSub.id,
          status,
          feedback,
          score: scoreValue,
        }),
      });

      if (res.ok) {
        setGradingSub(null);
        setFeedback("");
        setScore("");
        fetchSubmissions();
      }
    } catch (err) {
      console.error("Grading failed", err);
    } finally {
      setIsGrading(false);
    }
  }



  if (loading) return <div className="p-8 animate-pulse text-muted-foreground font-mono italic">Scanning student repos...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Submissions Hub</h1>
          <p className="text-muted-foreground">Manage student pull requests, peer reviews, and grading cycles.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search students..." 
              className="pl-10 pr-4 py-2 bg-background border border-border rounded-lg text-sm w-64 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Student Profile</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Week / Module</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">GitHub Repository</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Score</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground">Status</th>
                <th className="px-6 py-4 font-semibold text-muted-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {submissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">
                    No assignment submissions detected for this cohort yet.
                  </td>
                </tr>
              ) : (
                submissions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-xs uppercase">
                          {sub.student_name.slice(0, 2)}
                        </div>
                        <span className="font-medium text-foreground">{sub.student_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono text-xs">WEEK_{sub.week_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={sub.github_url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-2 px-3 py-1 bg-muted rounded border border-border text-xs font-mono hover:text-primary hover:border-primary/30 transition-all"
                      >
                        <Github className="w-4 h-4" />
                        {sub.github_url.split('/').pop()}
                        <ExternalLink className="w-3 h-3 ml-1" />
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      {sub.score != null ? (
                        <div className="flex items-center gap-1.5">
                          <Award className="w-3.5 h-3.5 text-yellow-500" />
                          <span className={`font-bold text-sm tabular-nums ${
                            sub.score >= 70 ? 'text-emerald-500' : 
                            sub.score >= 50 ? 'text-yellow-500' : 
                            'text-red-500'
                          }`}>
                            {sub.score}/100
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        sub.status === 'passed' ? 'default' : 
                        sub.status === 'failed' ? 'destructive' : 'secondary'
                      } className="capitalize flex items-center gap-1.5 w-fit">
                        {sub.status === 'pending' && <Clock className="w-3 h-3" />}
                        {sub.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:bg-primary/10"
                        onClick={() => {
                          setGradingSub(sub);
                          setFeedback(sub.admin_feedback || "");
                          setScore(sub.score != null ? String(sub.score) : "");
                        }}
                      >
                        View & Grade
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {gradingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-card w-full max-w-xl border border-border rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] flex flex-col max-h-[90vh] my-4">
            <div className="p-8 border-b border-border bg-muted/20 relative sticky top-0 z-10">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-2">
                  {gradingSub.student_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{gradingSub.student_name}</h2>
                  <p className="text-sm text-muted-foreground tracking-tight">Week {gradingSub.week_number} Pull Request</p>
                </div>
              </div>
              <a 
                href={gradingSub.github_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 bg-background border border-border rounded-xl text-sm hover:border-primary/30 transition-all font-mono"
              >
                <Github className="w-5 h-5" />
                <span className="flex-1 truncate">{gradingSub.github_url}</span>
                <ExternalLink className="w-4 h-4 text-muted-foreground" />
              </a>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-card">
              {/* Submitted File Preview */}
              {gradingSub.submission_file_keys && gradingSub.submission_file_keys.length > 0 && (
                <div className="space-y-2 pt-1">
                  <p className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Paperclip className="w-3 h-3 text-yellow-500" />
                    Submitted Assets ({gradingSub.submission_file_keys.length})
                  </p>
                  <div className="space-y-2">
                    {gradingSub.submission_file_keys.map((fileKey, idx) => (
                      <SecureFilePreview
                        key={idx}
                        fileKey={fileKey}
                        fileName={fileKey.split("-").slice(1).join("-") || "submission"}
                        mode="admin"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Score Input */}
              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground px-1">
                  <Award className="w-4 h-4 text-yellow-500" />
                  Score (out of 100)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="e.g. 85"
                    className="w-full p-4 bg-background border border-border rounded-2xl focus:ring-1 focus:ring-yellow-500 focus:border-yellow-500 focus:outline-none transition-all text-2xl font-bold tabular-nums text-center"
                    value={score}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || (parseInt(val, 10) >= 0 && parseInt(val, 10) <= 100)) {
                        setScore(val);
                      }
                    }}
                    disabled={isGrading}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 font-bold text-lg">/100</span>
                </div>
                {score !== "" && (
                  <div className="flex items-center gap-2 px-1">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          parseInt(score) >= 70 ? 'bg-emerald-500' : 
                          parseInt(score) >= 50 ? 'bg-yellow-500' : 
                          'bg-red-500'
                        }`}
                        style={{ width: `${Math.min(parseInt(score) || 0, 100)}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold tabular-nums ${
                      parseInt(score) >= 70 ? 'text-emerald-500' : 
                      parseInt(score) >= 50 ? 'text-yellow-500' : 
                      'text-red-500'
                    }`}>
                      {score}%
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold flex items-center gap-2 uppercase tracking-wider text-muted-foreground px-1">
                  <MessageSquare className="w-4 h-4" />
                  Admin_Feedback_Manifest
                </label>
                <textarea 
                  className="w-full min-h-[140px] p-4 bg-background border border-border rounded-2xl focus:ring-1 focus:ring-primary focus:outline-none transition-all text-sm italic"
                  placeholder="Insert feedback regarding repo structure, tests, and documentation standards..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={isGrading}
                />
              </div>
            </div>

            <div className="p-8 border-t border-border bg-muted/20 sticky bottom-0 z-10">
              <div className="flex gap-3">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="px-6"
                  onClick={() => {
                    setGradingSub(null);
                    setScore("");
                  }}
                  disabled={isGrading}
                >
                  Cancel
                </Button>
                <div className="flex gap-2 flex-1">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="flex-1 gap-2 border-red-500/20 text-red-500 hover:bg-red-500/10"
                    onClick={() => handleGradeSubmission('failed')}
                    disabled={isGrading}
                  >
                    <X className="w-4 h-4" />
                    Fail
                  </Button>
                  <Button 
                    type="button" 
                    className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => handleGradeSubmission('passed')}
                    disabled={isGrading}
                  >
                    <Check className="w-4 h-4" />
                    Pass & Approve
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

