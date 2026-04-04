"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Trash2, 
  Search, 
  Code, 
  Eye, 
  Trophy,
  CheckCircle2,
  Terminal,
  Edit3,
  X
} from "lucide-react";

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
  solution_code: string;
  status: 'active' | 'solved' | 'archived';
  submissions?: LabSubmission[];
  created_at: string;
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(";").shift();
  return null;
}

export default function AdminLabsPage() {
  const [labs, setLabs] = useState<BreakItLab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLab, setSelectedLab] = useState<BreakItLab | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingSubmissions, setViewingSubmissions] = useState<number | null>(null);

  const router = useRouter();
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api";

  const fetchLabs = useCallback(async () => {
    try {
      const token = getCookie("auth_token");
      if (!token) {
        router.push("/admin/login");
        return;
      }

      const res = await fetch(`${apiBase}/v1/labs`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to fetch labs");
      const data = await res.json();
      setLabs(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [router, apiBase]);

  useEffect(() => {
    fetchLabs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveLab = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const labData = {
      title: formData.get("title") as string,
      scenario: formData.get("scenario") as string,
      broken_code: formData.get("broken_code") as string,
      solution_code: formData.get("solution_code") as string,
      status: formData.get("status") as string,
    };

    try {
      const token = getCookie("auth_token");
      const method = selectedLab ? "PUT" : "POST";
      const url = selectedLab ? `${apiBase}/v1/admin/labs/${selectedLab.id}` : `${apiBase}/v1/admin/labs`;
      
      const payload = selectedLab ? { ...labData, id: selectedLab.id } : labData;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save lab");
      
      setIsModalOpen(false);
      setSelectedLab(null);
      fetchLabs();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const handleDeleteLab = async (id: number) => {
    if (!confirm("Are you sure you want to delete this lab? All submissions will be lost.")) return;

    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${apiBase}/v1/admin/labs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error("Failed to delete lab");
      fetchLabs();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const toggleWinner = async (subID: number, isWinner: boolean) => {
    try {
      const token = getCookie("auth_token");
      const res = await fetch(`${apiBase}/v1/admin/labs/winner`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ submission_id: subID, is_winner: isWinner }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      
      if (viewingSubmissions) {
        const updatedRes = await fetch(`${apiBase}/v1/labs/${viewingSubmissions}`);
        const updatedLab = await updatedRes.json();
        setLabs(labs.map(l => l.id === viewingSubmissions ? updatedLab : l));
      }
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
    }
  };

  const filteredLabs = labs.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.status.includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="text-muted-foreground animate-pulse font-mono">_init_loading_labs...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
            <Terminal className="w-8 h-8 text-primary" />
            &quot;Break-It&quot; Labs Manager
          </h1>
          <p className="text-muted-foreground">&quot;Break-It&quot; labs are high-stakes, real-world troubleshooting scenarios. You are given a broken production environment and must identify, document, and fix the root cause under pressure.</p>
        </div>
        <button 
          onClick={() => { setSelectedLab(null); setIsModalOpen(true); }}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Create New Lab
        </button>
      </div>

      {/* Control Bar */}
      <div className="bg-card border border-border p-4 rounded-xl flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search labs by title or status..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-muted/50 border-none rounded-lg py-2 pl-10 text-sm focus:ring-1 focus:ring-primary outline-none"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredLabs.map((lab) => (
          <div key={lab.id} className="bg-card border border-border rounded-xl p-6 hover:shadow-md transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-bold">{lab.title}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    lab.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' :
                    lab.status === 'solved' ? 'bg-primary/10 text-primary' : 'bg-slate-500/10 text-slate-500'
                  }`}>
                    {lab.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lab.scenario}</p>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setSelectedLab(lab); setIsModalOpen(true); }}
                  className="p-2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDeleteLab(lab.id)}
                  className="p-2 text-muted-foreground hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="bg-red-500/5 rounded-lg p-4 border border-red-500/10">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    <Code className="w-3 h-3" />
                    Current Broken State
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap text-muted-foreground scrollbar-hide max-h-[200px] overflow-y-auto">
                    {lab.broken_code}
                  </pre>
               </div>

               <div className="bg-emerald-500/5 rounded-lg p-4 border border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-emerald-500 uppercase tracking-widest">
                    <CheckCircle2 className="w-3 h-3" />
                    Reference Solution
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap text-emerald-500/80 scrollbar-hide max-h-[200px] overflow-y-auto">
                    {lab.solution_code || "No solution provided_"}
                  </pre>
               </div>
            </div>
            
            <div className="mt-6 flex flex-col justify-end">
                <button 
                  onClick={async () => {
                    const res = await fetch(`${apiBase}/v1/labs/${lab.id}`);
                    const fullLab = await res.json();
                    setLabs(labs.map(l => l.id === lab.id ? fullLab : l));
                    setViewingSubmissions(viewingSubmissions === lab.id ? null : lab.id);
                  }}
                  className={`w-full py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    viewingSubmissions === lab.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted hover:bg-border text-foreground"
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  {viewingSubmissions === lab.id ? "Hide Submissions" : "View Submissions"}
                </button>
            </div>

            {/* Submissions Thread */}
            {viewingSubmissions === lab.id && (
              <div className="mt-8 pt-8 border-t border-border space-y-4 animate-in fade-in slide-in-from-top-2">
                <h4 className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Awaiting Review</h4>
                {lab.submissions && lab.submissions.length > 0 ? (
                  lab.submissions.map((sub) => (
                    <div key={sub.id} className={`border rounded-xl overflow-hidden transition-all ${
                      sub.is_winner ? "border-primary/50 bg-primary/5" : "border-border bg-muted/20"
                    }`}>
                      <div className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
                            {sub.student_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="text-sm font-bold">{sub.student_name}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(sub.created_at).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => toggleWinner(sub.id, !sub.is_winner)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              sub.is_winner 
                              ? "bg-primary text-primary-foreground" 
                              : "border border-border text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            <Trophy className="w-3 h-3" />
                            {sub.is_winner ? "Verified Winner" : "Mark as Winner"}
                          </button>
                        </div>
                      </div>
                      <div className="px-4 pb-6">
                        <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          <Terminal className="w-3 h-3" /> Proposed Solution_
                        </div>
                        <div className="bg-slate-950 border border-border/50 rounded-xl p-6 font-mono text-[11px] overflow-x-auto text-emerald-400 leading-relaxed whitespace-pre-wrap max-h-[400px] overflow-y-auto">
                          {sub.proposed_fix}
                        </div>
                      </div>
                      
                      {/* Comments Integration */}
                      {sub.comments && sub.comments.length > 0 && (
                        <div className="bg-black/20 p-4 border-t border-border/50">
                          <div className="space-y-3">
                            {sub.comments.map(c => (
                              <div key={c.id} className="text-[11px] font-mono flex gap-2">
                                <span className="text-primary font-bold">{c.student_name}:</span>
                                <span className="text-muted-foreground">{c.body}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground italic text-sm">
                    No solutions submitted yet.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lab Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <form onSubmit={handleSaveLab}>
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {selectedLab ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
                  {selectedLab ? "Edit Break-It Lab" : "Create New Lab"}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
                <div className="space-y-4 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Lab Title</label>
                  <input 
                    name="title"
                    defaultValue={selectedLab?.title}
                    required
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="E.g. Broken Nginx Ingress Controller"
                  />
                </div>
                
                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Scenario (Markdown)</label>
                  <textarea 
                    name="scenario"
                    defaultValue={selectedLab?.scenario}
                    required
                    rows={8}
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2 font-mono text-sm outline-none focus:ring-1 focus:ring-primary"
                    placeholder="Describe the catastrophic failure student needs to fix..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Broken Code</label>
                  <textarea 
                    name="broken_code"
                    defaultValue={selectedLab?.broken_code}
                    required
                    rows={8}
                    className="w-full bg-slate-950 border border-border rounded-lg px-4 py-2 font-mono text-sm text-red-400 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="The broken configuration..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Expected Solution</label>
                  <textarea 
                    name="solution_code"
                    defaultValue={selectedLab?.solution_code}
                    required
                    rows={8}
                    className="w-full bg-slate-950 border border-border rounded-lg px-4 py-2 font-mono text-sm text-emerald-400 outline-none focus:ring-1 focus:ring-primary"
                    placeholder="The correct fix..."
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Initial Status</label>
                  <select 
                    name="status"
                    defaultValue={selectedLab?.status || "active"}
                    className="w-full bg-muted/30 border border-border rounded-lg px-4 py-2.5 outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="active">Active</option>
                    <option value="solved">Solved</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              <div className="p-6 bg-muted/20 border-t border-border flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2 text-sm font-bold text-muted-foreground hover:text-foreground transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-primary text-primary-foreground px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-primary/20"
                >
                  {selectedLab ? "Update Scenario" : "Deploy Lab"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
