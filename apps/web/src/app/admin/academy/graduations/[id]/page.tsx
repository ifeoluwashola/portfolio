"use client";

import { useEffect, useState, use } from "react";
import { getCapstoneById, approveCapstone, rejectCapstone } from "@/app/academy/actions";
import { 
  GraduationCap, 
  Github, 
  Globe, 
  Layers, 
  FileText,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ArrowLeft
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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

export default function CapstoneReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [capstone, setCapstone] = useState<Capstone | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  
  // Approval Form State
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [cohortName, setCohortName] = useState("Cloud Native Mastery - [Batch 1]");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGitHubUrl] = useState("");

  // Reject Form State
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    fetchCapstone();
  }, [id]);

  const fetchCapstone = async () => {
    setLoading(true);
    const data = await getCapstoneById(parseInt(id));
    if (data && !data.error) {
      setCapstone(data);
      setGitHubUrl(data.repo_url || "");
    }
    setLoading(false);
  };

  const handleApprove = async () => {
    if (!capstone) return;
    setApproving(true);
    
    const res = await approveCapstone(capstone.id, {
      cohort_name: cohortName,
      linkedin_url: linkedinUrl,
      github_url: githubUrl
    });

    if (res.success) {
      router.push("/admin/academy/graduations");
    } else {
      alert(res.error || "Approval failed");
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!capstone || !feedback) return;
    setIsRejecting(true);

    const res = await rejectCapstone(capstone.id, feedback);
    if (res.success) {
      router.push("/admin/academy/graduations");
    } else {
      alert(res.error || "Reject failed");
      setIsRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-muted-foreground gap-3">
        <Loader2 className="animate-spin" size={32} />
        <span>Loading PR details...</span>
      </div>
    );
  }

  if (!capstone) {
    return (
      <div className="p-6">
        <div className="bg-card/30 border border-dashed border-border rounded-2xl py-20 text-center space-y-4">
          <h3 className="text-white font-medium text-lg">Capstone Not Found</h3>
          <Link href="/admin/academy/graduations" className="text-yellow-500 hover:underline">
            Return to queue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link 
          href="/admin/academy/graduations" 
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm font-medium uppercase tracking-wider"
        >
          <ArrowLeft size={16} /> Back to Queue
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
            <GraduationCap className="text-[#eab308]" size={36} />
            Capstone Review
          </h1>
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={() => setShowRejectModal(true)}
              className="flex-1 md:flex-none px-6 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl hover:bg-slate-700 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <XCircle size={18} /> Request Changes
            </button>
            <button 
              onClick={() => setShowApproveModal(true)}
              className="flex-1 md:flex-none px-6 py-2.5 bg-[#eab308] text-[#020617] font-bold rounded-xl hover:bg-[#ca8a04] transition-all shadow-[0_0_15px_rgba(234,179,8,0.15)] flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} /> Approve PR
            </button>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-background border border-border rounded-2xl overflow-hidden p-8 space-y-6">
            <div className="space-y-2 border-b border-border pb-6">
               <h2 className="text-2xl font-bold text-white">{capstone.project_title}</h2>
               <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold flex items-center gap-2">
                 BY {capstone.student_name} <span className="w-1 h-1 rounded-full bg-slate-700"></span> {new Date(capstone.created_at).toLocaleDateString()}
               </p>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <FileText size={16} /> Project Description
              </h3>
              <div className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
                {capstone.description}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Links */}
        <div className="space-y-6">
          <div className="bg-card/50 border border-border rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">Project Resources</h3>
            
            <a 
              href={capstone.repo_url} 
              target="_blank" 
              className="w-full flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-slate-500 transition-colors group"
            >
              <div className="flex items-center gap-3 text-white font-medium">
                <Github size={20} className="text-slate-400 group-hover:text-white" />
                Repository
              </div>
            </a>
            
            <a 
              href={capstone.live_demo_url} 
              target="_blank" 
              className="w-full flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-slate-500 transition-colors group"
            >
              <div className="flex items-center gap-3 text-white font-medium">
                <Globe size={20} className="text-slate-400 group-hover:text-white" />
                Live Demo
              </div>
            </a>

            <a 
              href={capstone.architecture_diagram_url} 
              target="_blank" 
              className="w-full flex items-center justify-between p-4 bg-background border border-border rounded-xl hover:border-slate-500 transition-colors group"
            >
              <div className="flex items-center gap-3 text-white font-medium">
                <Layers size={20} className="text-slate-400 group-hover:text-white" />
                Architecture
              </div>
            </a>
          </div>
        </div>
      </div>

      {/* Approval Modal */}
      {showApproveModal && (
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
                onClick={() => setShowApproveModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
                disabled={approving}
              >
                Cancel
              </button>
              <button 
                onClick={handleApprove}
                disabled={approving || !linkedinUrl}
                className="flex-1 px-4 py-3 bg-[#eab308] text-[#020617] font-bold rounded-xl hover:bg-[#ca8a04] transition-colors disabled:opacity-50"
              >
                {approving ? (
                   <div className="flex items-center justify-center gap-2">
                     <Loader2 className="animate-spin" size={18} /> Processing...
                   </div>
                ) : "Approve & Publish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-background border border-border max-w-xl w-full rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center gap-3 text-red-500 mb-8">
              <XCircle size={32} />
              <h2 className="text-2xl font-bold">Request Changes</h2>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Feedback for Student</label>
                <textarea 
                  className="w-full bg-[#020617] border border-border rounded-xl p-3 text-white focus:ring-1 focus:ring-red-500 outline-none transition-all h-32 resize-none"
                  placeholder="Explain what needs to be fixed..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                />
              </div>

              <div className="bg-red-950/20 border border-red-800/30 p-4 rounded-xl flex items-start gap-3">
                 <AlertCircle className="text-red-500 shrink-0" size={20} />
                 <p className="text-xs text-red-400/80 leading-relaxed">
                   The student will be notified and the capstone status will be changed to <span className="font-bold">needs_revision</span>. It will be removed from this queue.
                 </p>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors"
                disabled={isRejecting}
              >
                Cancel
              </button>
              <button 
                onClick={handleReject}
                disabled={isRejecting || !feedback}
                className="flex-1 px-4 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500 transition-colors disabled:opacity-50"
              >
                {isRejecting ? (
                   <div className="flex items-center justify-center gap-2">
                     <Loader2 className="animate-spin" size={18} /> Processing...
                   </div>
                ) : "Send Feedback"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
