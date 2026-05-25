"use client";

import { useEffect, useState } from "react";
import { getPendingCapstones } from "@/app/academy/actions";
import { 
  GraduationCap, 
  Github, 
  Globe, 
  Layers, 
  FileText,
  Loader2,
  ChevronRight
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
  created_at: string;
}

export default function AdminGraduationsPage() {
  const [capstones, setCapstones] = useState<Capstone[]>([]);
  const [loading, setLoading] = useState(true);

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
            <Link 
              key={cap.id}
              href={`/admin/academy/graduations/${cap.id}`}
              className="block bg-background border border-border rounded-2xl overflow-hidden hover:border-[#eab308]/50 transition-all group hover:shadow-[0_0_20px_rgba(234,179,8,0.05)]"
            >
              <div className="p-6 flex flex-col md:flex-row gap-6 items-center">
                {/* Project Meta */}
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#eab308] border border-[#eab308]/20 font-bold">
                        {cap.student_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-lg group-hover:text-[#eab308] transition-colors">{cap.project_title}</h3>
                        <p className="text-muted-foreground text-xs uppercase tracking-widest font-semibold flex items-center gap-1">
                          BY {cap.student_name} <span className="w-1 h-1 rounded-full bg-slate-700 mx-1"></span> {new Date(cap.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-foreground text-sm leading-relaxed line-clamp-2">
                    {cap.description}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-2">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Github size={14} /> Repository
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Globe size={14} /> Live Demo
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <Layers size={14} /> Architecture
                    </div>
                  </div>
                </div>

                {/* Arrow */}
                <div className="hidden md:flex pr-4">
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
