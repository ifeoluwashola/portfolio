"use client";

import { useEffect, useState, useMemo } from "react";
import { getPendingCapstones } from "@/app/academy/actions";
import { 
  GraduationCap, 
  Github, 
  Globe, 
  Layers, 
  FileText,
  Loader2,
  ChevronRight,
  Clock,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Search,
  MessageSquare,
  Sparkles
} from "lucide-react";
import Link from "next/link";

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
  feedback?: string;
  student_comment?: string;
  created_at: string;
  updated_at?: string;
}

type TabType = "all" | "needs_review" | "needs_revision" | "approved";

export default function AdminGraduationsPage() {
  const [capstones, setCapstones] = useState<Capstone[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  const counts = useMemo(() => {
    return {
      all: capstones.length,
      needs_review: capstones.filter(c => c.status === "pending" || c.status === "resubmitted").length,
      needs_revision: capstones.filter(c => c.status === "needs_revision").length,
      approved: capstones.filter(c => c.status === "approved").length,
    };
  }, [capstones]);

  const filteredCapstones = useMemo(() => {
    return capstones.filter(cap => {
      // Tab filter
      if (activeTab === "needs_review" && cap.status !== "pending" && cap.status !== "resubmitted") {
        return false;
      }
      if (activeTab === "needs_revision" && cap.status !== "needs_revision") {
        return false;
      }
      if (activeTab === "approved" && cap.status !== "approved") {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = cap.project_title?.toLowerCase().includes(query);
        const matchesStudent = cap.student_name?.toLowerCase().includes(query);
        const matchesComment = cap.student_comment?.toLowerCase().includes(query);
        return matchesTitle || matchesStudent || matchesComment;
      }

      return true;
    });
  }, [capstones, activeTab, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "resubmitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <RotateCcw size={12} className="animate-spin-slow" /> Resubmitted by Student
          </span>
        );
      case "needs_revision":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/30 text-orange-400">
            <AlertCircle size={12} /> Changes Requested
          </span>
        );
      case "approved":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 size={12} /> Approved / Graduated
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Clock size={12} /> Pending Review
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="text-[#eab308]" />
            Graduation Queue (Capstone PRs)
          </h1>
          <p className="text-slate-400 text-sm">Review capstone projects, provide feedback, and promote students to Alumni status.</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-border pb-3">
        <Link
          href="/admin/academy/submissions"
          className="px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 border border-transparent hover:border-border font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all"
        >
          <Github className="w-4 h-4" /> Weekly Assignments
        </Link>
        <Link
          href="/admin/academy/graduations"
          className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs uppercase tracking-wider flex items-center gap-2"
        >
          <GraduationCap className="w-4 h-4 text-[#eab308]" /> Graduation PR Queue (Capstone)
        </Link>
      </div>

      {/* Queue Filter Bar & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "all"
                ? "bg-[#eab308] text-slate-950 shadow-[0_0_15px_rgba(234,179,8,0.2)]"
                : "bg-background border border-border text-muted-foreground hover:text-white"
            }`}
          >
            All Submissions
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "all" ? "bg-slate-950/20 text-slate-950" : "bg-card text-muted-foreground"
            }`}>
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("needs_review")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "needs_review"
                ? "bg-amber-500 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.2)]"
                : "bg-background border border-border text-muted-foreground hover:text-white"
            }`}
          >
            Needs Review
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "needs_review" ? "bg-slate-950/20 text-slate-950" : "bg-card text-muted-foreground"
            }`}>
              {counts.needs_review}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("needs_revision")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "needs_revision"
                ? "bg-orange-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                : "bg-background border border-border text-muted-foreground hover:text-white"
            }`}
          >
            Changes Requested
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "needs_revision" ? "bg-slate-950/20 text-slate-950" : "bg-card text-muted-foreground"
            }`}>
              {counts.needs_revision}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("approved")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              activeTab === "approved"
                ? "bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "bg-background border border-border text-muted-foreground hover:text-white"
            }`}
          >
            Approved
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${
              activeTab === "approved" ? "bg-slate-950/20 text-slate-950" : "bg-card text-muted-foreground"
            }`}>
              {counts.approved}
            </span>
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by student or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-1.5 text-xs text-foreground focus:ring-1 focus:ring-yellow-500 outline-none transition-all placeholder:text-muted-foreground/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <Loader2 className="animate-spin text-[#eab308]" size={32} />
          <span className="text-sm">Scanning graduation queue...</span>
        </div>
      ) : filteredCapstones.length === 0 ? (
        <div className="bg-card/30 border border-dashed border-border rounded-2xl py-20 text-center space-y-4">
          <div className="flex justify-center text-muted-foreground/50">
             <FileText size={48} />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-medium text-lg">No Submissions Found</h3>
            <p className="text-muted-foreground text-sm">
              {searchQuery ? "No capstone projects match your search query." : "No capstone projects found in this category."}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCapstones.map((cap) => (
            <Link 
              key={cap.id}
              href={`/admin/academy/graduations/${cap.id}`}
              className="block bg-background border border-border rounded-2xl overflow-hidden hover:border-[#eab308]/50 transition-all group hover:shadow-[0_0_20px_rgba(234,179,8,0.05)]"
            >
              <div className="p-6 flex flex-col md:flex-row gap-6 items-start md:items-center">
                {/* Project Meta */}
                <div className="flex-1 space-y-4 w-full">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#eab308] border border-[#eab308]/20 font-bold shrink-0">
                        {cap.student_name ? cap.student_name.charAt(0) : "S"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <h3 className="text-white font-bold text-lg group-hover:text-[#eab308] transition-colors">{cap.project_title}</h3>
                        </div>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 mt-0.5">
                          BY {cap.student_name} 
                          <span className="w-1 h-1 rounded-full bg-slate-700"></span> 
                          Submitted {new Date(cap.created_at).toLocaleDateString()}
                          {cap.updated_at && cap.updated_at !== cap.created_at && (
                            <>
                              <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                              <span className="text-blue-400">Updated {new Date(cap.updated_at).toLocaleDateString()}</span>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0">
                      {getStatusBadge(cap.status)}
                    </div>
                  </div>

                  <p className="text-foreground text-sm leading-relaxed line-clamp-2">
                    {cap.description}
                  </p>

                  {/* Student Response Snippet Preview */}
                  {cap.student_comment && (
                    <div className="bg-blue-950/20 border border-blue-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-blue-300">
                      <MessageSquare size={14} className="text-blue-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-blue-400">Student Note / Response:</span>
                        <p className="line-clamp-2 italic text-blue-200/90">&ldquo;{cap.student_comment}&rdquo;</p>
                      </div>
                    </div>
                  )}

                  {/* Admin Feedback Preview (if changes were requested) */}
                  {cap.status === "needs_revision" && cap.feedback && (
                    <div className="bg-orange-950/20 border border-orange-500/20 rounded-xl p-3 flex items-start gap-2.5 text-xs text-orange-300">
                      <AlertCircle size={14} className="text-orange-400 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold uppercase tracking-wider text-[10px] text-orange-400">Requested Changes:</span>
                        <p className="line-clamp-2 text-orange-200/90">{cap.feedback}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-4 pt-1">
                    {cap.repo_url && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                        <Github size={14} /> Repository
                      </div>
                    )}
                    {cap.live_demo_url && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                        <Globe size={14} /> Live Demo
                      </div>
                    )}
                    {cap.architecture_diagram_url && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white">
                        <Layers size={14} /> Architecture
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex pr-2 shrink-0">
                   <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-[#eab308]/10 group-hover:text-[#eab308] transition-all">
                     <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

