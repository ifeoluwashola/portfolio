"use client";

import { useState } from "react";
import { submitCapstone } from "@/app/academy/actions";
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
  ShieldCheck
} from "lucide-react";
import Link from "next/link";

export default function CapstoneSubmissionPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    project_title: "",
    description: "",
    architecture_diagram_url: "",
    live_demo_url: "",
    repo_url: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await submitCapstone(formData);
    if (res.success) {
      setSuccess(true);
    } else {
      setError(res.error || "Failed to submit capstone");
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto py-20 px-6 text-center space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center">
            <div className="p-6 bg-emerald-900/20 border-2 border-emerald-500/50 rounded-full text-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)]">
                <ShieldCheck size={64} className="animate-bounce" />
            </div>
        </div>
        <div className="space-y-4">
           <h1 className="text-3xl font-bold text-white tracking-tight">MISSION ACCOMPLISHED</h1>
           <p className="text-slate-400 text-lg leading-relaxed">
             Your Capstone Project (PR) has been submitted for final review. 
             Academy Admins will audit your architecture and code before issuing your graduation certificate.
           </p>
        </div>
        <div className="pt-6">
           <Link 
            href="/academy/dashboard"
            className="inline-flex items-center gap-2 bg-[#eab308] text-[#020617] font-bold py-3 px-8 rounded-xl hover:bg-[#ca8a04] transition-all"
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
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-[#eab308]" />
            Final Module: Capstone PR
          </h1>
          <p className="text-slate-400 text-sm italic font-mono">/academy/final_submission.sh --mode release</p>
        </div>
        <div className="bg-blue-950/20 border border-blue-800/30 p-3 rounded-lg flex items-center gap-3 text-xs text-blue-400">
           <AlertCircle size={16} /> 
           Final project review takes 48-72 hours.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left Column: Details */}
        <div className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FileText size={14} /> Project Title
             </label>
             <input 
               required
               className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all placeholder:text-slate-700 font-medium"
               placeholder="Cloud-Native E-Commerce Infrastructure..."
               value={formData.project_title}
               onChange={(e) => setFormData({...formData, project_title: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FileText size={14} /> Brief Description
             </label>
             <textarea 
               required
               className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white text-sm min-h-[160px] focus:ring-1 focus:ring-[#eab308] outline-none transition-all placeholder:text-slate-700 font-medium"
               placeholder="Describe your architecture, tools used (Terraform, K8s, Helm), and the problem it solves..."
               value={formData.description}
               onChange={(e) => setFormData({...formData, description: e.target.value})}
             />
           </div>
        </div>

        {/* Right Column: URLs */}
        <div className="space-y-6">
           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Github size={14} /> Repository URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all placeholder:text-slate-700"
               placeholder="https://github.com/yourusername/capstone"
               value={formData.repo_url}
               onChange={(e) => setFormData({...formData, repo_url: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Globe size={14} /> Live Demo URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all placeholder:text-slate-700"
               placeholder="https://capstone.yourdomain.com"
               value={formData.live_demo_url}
               onChange={(e) => setFormData({...formData, live_demo_url: e.target.value})}
             />
           </div>

           <div className="space-y-2">
             <label className="text-xs font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <Layers size={14} /> Architecture Diagram URL
             </label>
             <input 
               required
               type="url"
               className="w-full bg-[#0f172a] border border-slate-800 rounded-xl p-4 text-white focus:ring-1 focus:ring-[#eab308] outline-none transition-all placeholder:text-slate-700"
               placeholder="URL to your diagram (Lucid, Eraser, Github)..."
               value={formData.architecture_diagram_url}
               onChange={(e) => setFormData({...formData, architecture_diagram_url: e.target.value})}
             />
           </div>

           <div className="pt-4">
             {error && (
               <div className="mb-4 bg-red-950/20 border border-red-800/30 p-3 rounded-lg flex items-center gap-3 text-xs text-red-500">
                  <XCircle size={16} /> {error}
               </div>
             )}
             <button 
               type="submit"
               disabled={loading}
               className="w-full bg-[#eab308] text-[#020617] font-bold py-4 rounded-xl hover:bg-[#ca8a04] shadow-[0_4px_20px_rgba(234,179,8,0.2)] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
             >
               {loading ? (
                  <Loader2 className="animate-spin" size={20} />
               ) : (
                  <>
                    Submit for Review <Send size={18} />
                  </>
               )}
             </button>
           </div>
        </div>
      </form>

      <div className="bg-slate-900/30 border border-slate-800 p-8 rounded-2xl flex flex-col md:flex-row gap-8 items-center">
         <div className="flex-1 space-y-2">
           <h3 className="text-white font-bold text-lg flex items-center gap-2">
              <CheckCircle2 className="text-[#eab308]" /> Graduation Eligibility
           </h3>
           <p className="text-slate-400 text-sm leading-relaxed">
             By submitting this capstone, you authorize Kybern Academy to showcase your project and verified milestones (assignments/labs) to partner companies and potential recruiters.
           </p>
         </div>
         <div className="flex gap-4">
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center w-24">
               <div className="text-[#eab308] font-bold text-lg">12</div>
               <div className="text-[10px] uppercase tracking-wider text-slate-500">Weeks</div>
            </div>
            <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 text-center w-24">
               <div className="text-[#eab308] font-bold text-lg">ALL</div>
               <div className="text-[10px] uppercase tracking-wider text-slate-500">Modules</div>
            </div>
         </div>
      </div>
    </div>
  );
}

function XCircle({ size }: { size: number }) {
    return <AlertCircle size={size} className="text-red-500" />
}
