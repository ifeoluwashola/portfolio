"use client";

import { useEffect, useState } from "react";
import { getPendingCapstones, approveCapstone } from "@/app/academy/actions";
import { 
  GraduationCap, 
  Github, 
  Globe, 
  Layers, 
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle
} from "lucide-react";

interface Capstone {
  id: number;
  student_id: string;
  student_name: string;
  project_title: string;
  description: string;
  architecture_diagram_url: string;
  live_demo_url: string;
  repo_url: string;
  status: string;
  created_at: string;
}

export default function AdminGraduationsPage() {
  const [capstones, setCapstones] = useState<Capstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  
  // Approval Form State
  const [selectedCapstone, setSelectedCapstone] = useState<Capstone | null>(null);
  const [cohortName, setCohortName] = useState("Cloud Native Mastery - [Batch 1]");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGitHubUrl] = useState("");

  useEffect(() => {
    fetchCapstones();
  }, []);

  const fetchCapstones = async () => {
    setLoading(true);
    const data = await getPendingCapstones();
    if (Array.isArray(data)) {
      setCapstones(data);
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!selectedCapstone) return;
    setApprovingId(selectedCapstone.id);
    
    const res = await approveCapstone(selectedCapstone.id, {
      cohort_name: cohortName,
      linkedin_url: linkedinUrl,
      github_url: githubUrl
    });

    if (res.success) {
      setSelectedCapstone(null);
      fetchCapstones();
    } else {
      alert(res.error || "Approval failed");
    }
    setApprovingId(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <GraduationCap className="text-[#eab308]" />
          Graduation Queue (Capstone PRs)
        </h1>
        <p className="text-slate-400 text-sm">Review capstone projects and promote students to Alumni status.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="animate-spin" size={32} />
          <span>Scanning for new submissions...</span>
        </div>
      ) : capstones.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-2xl py-20 text-center space-y-4">
          <div className="flex justify-center text-muted-foreground/50">
             <FileText size={48} />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-medium text-lg">No Pending Submissions</h3>
            <p className="text-muted-foreground text-sm">The graduation queue is currently empty.</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-6">
          {capstones.map((cap) => (
            <div key={cap.id} className="bg-background border border-border rounded-2xl overflow-hidden hover:border-[#eab308]/30 transition-all group">
              <div className="p-6 flex flex-col md:flex-row gap-6">
                {/* Project Meta */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#eab308] border border-[#eab308]/20 font-bold">
                        {cap.student_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg">{cap.project_title}</h3>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold flex items-center gap-1">
                          BY {cap.student_name} <span className="w-1 h-1 rounded-full bg-slate-700 mx-1"></span> {new Date(cap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground text-sm leading-relaxed line-clamp-3">
                    {cap.description}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <a href={cap.repo_url} target="_blank" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                      <Github size={14} /> Repository
                    </a>
                    <a href={cap.live_demo_url} target="_blank" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                      <Globe size={14} /> Live Demo
                    </a>
                    <a href={cap.architecture_diagram_url} target="_blank" className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                      <Layers size={14} /> Architecture
                    </a>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:w-48 flex flex-col justify-center border-t md:border-t-0 md:border-l border-border p-6 md:p-0 md:pl-6 bg-card/30 md:bg-transparent">
                  <button 
                    onClick={() => {
                      setSelectedCapstone(cap);
                      setGitHubUrl(cap.repo_url);
                    }}
                    className="w-full bg-[#eab308] text-[#020617] font-bold py-2.5 rounded-lg hover:bg-[#ca8a04] transition-all shadow-[0_0_15px_rgba(234,179,8,0.1)] flex items-center justify-center gap-2 mb-3"
                  >
                    <CheckCircle2 size={18} /> Approve PR
                  </button>
                  <button className="w-full bg-slate-800 text-slate-400 font-bold py-2.5 rounded-lg hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approval Details Modal */}
      {selectedCapstone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background border border-border max-w-xl w-full rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-[#eab308] mb-8">
              <GraduationCap size={32} />
              <h2 className="text-2xl font-bold">Finalize Graduation</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cohort Name</label>
                <input 
                  className="w-full bg-[#020617] border border-border rounded-xl p-3 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all"
                  value={cohortName}
                  onChange={(e) => setCohortName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn URL</label>
                   <input 
                     className="w-full bg-[#020617] border border-border rounded-xl p-3 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all"
                     placeholder="https://linkedin.com/in/..."
                     value={linkedinUrl}
                     onChange={(e) => setLinkedinUrl(e.target.value)}
                   />
                 </div>
                 <div className="space-y-2">
                   <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GitHub URL</label>
                   <input 
                     className="w-full bg-[#020617] border border-border rounded-xl p-3 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all"
                     placeholder="https://github.com/..."
                     value={githubUrl}
                     onChange={(e) => setGitHubUrl(e.target.value)}
                   />
                 </div>
              </div>

              <div className="bg-yellow-950/20 border border-yellow-800/30 p-4 rounded-xl flex items-start gap-3">
                 <AlertCircle className="text-[#eab308] shrink-0" size={20} />
                 <p className="text-xs text-yellow-500/80 leading-relaxed">
                   By approving this project, the student&apos;s status will be changed to <span className="font-bold">Graduated</span> and 
                   this project will be published to the public Alumni Hall of Fame.
                 </p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setSelectedCapstone(null)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
                disabled={approvingId !== null}
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={approvingId !== null || !linkedinUrl}
                className="flex-1 px-4 py-3 bg-[#eab308] text-[#020617] font-bold rounded-xl hover:bg-[#ca8a04] transition-colors disabled:opacity-50"
              >
                {approvingId ? (
                   <div className="flex items-center justify-center gap-2">
                     <Loader2 className="animate-spin" size={18} /> Processing...
                   </div>
                ) : "Approve & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
