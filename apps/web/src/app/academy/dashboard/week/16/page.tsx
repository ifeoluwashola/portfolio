"use client";

import { useState, useEffect } from "react";
import { submitCapstone, getStudentCapstone } from "@/app/academy/actions";
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
  XCircle
} from "lucide-react";
import Link from "next/link";

interface Capstone {
  id: number;
  project_title: string;
  description: string;
  architecture_diagram_url: string;
  live_demo_url: string;
  repo_url: string;
  status: string;
  feedback?: string;
}

export default function CapstoneSubmissionPage() {
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [capstone, setCapstone] = useState<Capstone | null>(null);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_title: "",
    description: "",
    architecture_diagram_url: "",
    live_demo_url: "",
    repo_url: ""
  });

  useEffect(() => {
    fetchCapstone();
  }, []);

  const fetchCapstone = async () => {
    setInitialLoading(true);
    const res = await getStudentCapstone() as any;
    if (res && !res.error && res.data) {
      const capData = res.data as Capstone;
      setCapstone(capData);
      if (capData.status === "needs_revision") {
        setFormData({
          project_title: capData.project_title || "",
          description: capData.description || "",
          architecture_diagram_url: capData.architecture_diagram_url || "",
          live_demo_url: capData.live_demo_url || "",
          repo_url: capData.repo_url || ""
        });
      }
    }
    setInitialLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await submitCapstone(formData);
    if (res.success) {
      await fetchCapstone(); // Refresh to get the pending state
    } else {
      setError(res.error || "Failed to submit capstone");
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={32} />
        <span>Checking submission status...</span>
      </div>
    );
  }

  // If pending or approved, hide the form and show the status.
  if (capstone && (capstone.status === "pending" || capstone.status === "approved")) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
            <div className="p-6 bg-emerald-900/20 border-2 border-emerald-500/50 rounded-full text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <ShieldCheck size={64} className="animate-bounce" />
            </div>
        </div>
        <div className="space-y-4">
           <h1 className="text-3xl font-bold text-foreground tracking-tight">MISSION ACCOMPLISHED</h1>
           <p className="text-muted-foreground text-lg leading-relaxed">
             Your Capstone Project (PR) has been submitted for final review. 
             Academy Admins will audit your architecture and code before issuing your graduation certificate.
           </p>
           {capstone.status === "approved" && (
             <div className="bg-emerald-900/20 text-emerald-500 p-4 rounded-xl mt-4 border border-emerald-800/30 font-bold">
               Your Capstone has been approved! Congratulations!
             </div>
           )}
        </div>
        <div className="pt-6">
           <Link 
            href="/academy/dashboard"
            className="inline-flex items-center gap-2 bg-yellow-500 text-slate-950 font-bold py-3 px-8 rounded-xl hover:bg-yellow-400 transition-all"
           >
            Back to Dashboard <ArrowRight size={18} />
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6 space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <GraduationCap className="text-yellow-500" />
            Final Module: Capstone PR
          </h1>
          <p className="text-muted-foreground/60 text-sm italic font-mono">/academy/final_submission.sh --mode release</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-center gap-3 text-xs text-blue-500">
           <AlertCircle size={16} /> 
           Final project review takes 48-72 hours.
        </div>
      </div>

      {capstone?.status === "needs_revision" && (
        <div className="bg-red-950/20 border border-red-900/30 p-6 rounded-2xl flex flex-col md:flex-row gap-4 items-start shadow-[0_0_15px_rgba(239,68,68,0.05)]">
           <div className="p-3 bg-red-500/10 rounded-xl shrink-0 text-red-500">
             <XCircle size={24} />
           </div>
           <div className="space-y-2">
             <h3 className="text-red-500 font-bold tracking-tight text-lg">Revisions Requested</h3>
             <p className="text-slate-300 text-sm leading-relaxed">
               Your admin has reviewed your submission and requested the following changes before approval:
             </p>
             <div className="bg-[#020617] p-4 rounded-xl border border-red-900/20 text-red-400/90 text-sm font-mono whitespace-pre-wrap mt-2">
               {capstone.feedback}
             </div>
           </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <FileText size={14} /> Project Title
             </label>
             <input 
               required
               className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-medium"
               placeholder="Cloud-Native E-Commerce Infrastructure..."
               value={formData.project_title}
               onChange={(e) => setFormData({...formData, project_title: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Layers size={14} /> Description & Architecture Walkthrough
             </label>
             <textarea 
               required
               className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 min-h-[220px] resize-none leading-relaxed"
               placeholder="Explain your architectural decisions, tools used, and the problem this solves..."
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
             />
           </div>
        </div>

        {/* Right Column: Links */}
        <div className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Github size={14} /> GitHub Repository URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-sm"
               placeholder="https://github.com/..."
               value={formData.repo_url}
               onChange={(e) => setFormData({...formData, repo_url: e.target.value})}
             />
             <p className="text-xs text-muted-foreground">Must contain all Infrastructure as Code (Terraform/Helm), CI/CD pipelines, and application source.</p>
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Globe size={14} /> Live Demo URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-sm"
               placeholder="https://..."
               value={formData.live_demo_url}
               onChange={(e) => setFormData({...formData, live_demo_url: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 flex items-center gap-2">
                <Globe size={14} /> Architecture Diagram URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-background border border-border rounded-xl p-4 text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/30 font-mono text-sm"
               placeholder="https://lucidchart.com/... or raw image link"
               value={formData.architecture_diagram_url}
               onChange={(e) => setFormData({...formData, architecture_diagram_url: e.target.value})}
             />
           </div>
        </div>

        {error && (
          <div className="md:col-span-2 bg-red-950/20 text-red-500 p-4 rounded-xl border border-red-900/30 flex items-center gap-3 font-medium">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <div className="md:col-span-2 pt-6">
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-4 px-6 rounded-xl transition-all flex items-center justify-center gap-3 uppercase tracking-widest shadow-[0_0_20px_rgba(234,179,8,0.2)] hover:shadow-[0_0_30px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <Send size={20} />
                {capstone?.status === "needs_revision" ? "Resubmit Capstone PR" : "Submit Capstone PR"}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
