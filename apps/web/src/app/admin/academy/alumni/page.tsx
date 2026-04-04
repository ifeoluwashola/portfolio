"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Search, 
  GraduationCap, 
  ExternalLink, 
  Linkedin, 
  Github, 
  PlusCircle,
  X,
  ChevronRight,
  Code2,
  Layout,
  Edit3
} from "lucide-react";
import { 
  getAlumniList, 
  updateAlumni
} from "@/app/academy/actions";

interface CapstoneProject {
  id?: number;
  project_title: string;
  description: string;
  architecture_diagram_url: string;
  live_demo_url: string;
  repo_url: string;
}

interface AlumniProfile {
  id: number;
  student_id: string;
  student_name: string;
  slug: string;
  cohort_name: string;
  linkedin_url: string;
  github_url: string;
  projects?: CapstoneProject[];
  created_at: string;
}

export default function AlumniManagerPage() {
  const [alumni, setAlumni] = useState<AlumniProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingAlumni, setEditingAlumni] = useState<AlumniProfile | null>(null);
  
  // Graduation Form State
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [cohortName, setCohortName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [projects, setProjects] = useState<CapstoneProject[]>([
    { project_title: "", description: "", architecture_diagram_url: "", live_demo_url: "", repo_url: "" }
  ]);

  const router = useRouter();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const alumniData = await getAlumniList();

    if (Array.isArray(alumniData)) setAlumni(alumniData);
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProject = () => {
    setProjects([...projects, { project_title: "", description: "", architecture_diagram_url: "", live_demo_url: "", repo_url: "" }]);
  };

  const handleRemoveProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleProjectChange = (index: number, field: keyof CapstoneProject, value: string) => {
    const updated = [...projects];
    updated[index] = { ...updated[index], [field]: value };
    setProjects(updated);
  };

  const handleEditClick = (member: AlumniProfile) => {
    setEditingAlumni(member);
    setSelectedStudentId(member.student_id);
    setCohortName(member.cohort_name);
    setLinkedinUrl(member.linkedin_url);
    setGithubUrl(member.github_url);
    
    if (member.projects && member.projects.length > 0) {
      setProjects(member.projects.map(p => ({
        project_title: p.project_title,
        description: p.description,
        architecture_diagram_url: p.architecture_diagram_url,
        live_demo_url: p.live_demo_url,
        repo_url: p.repo_url
      })));
    } else {
      setProjects([{ project_title: "", description: "", architecture_diagram_url: "", live_demo_url: "", repo_url: "" }]);
    }
    
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
        student_id: selectedStudentId,
        cohort_name: cohortName,
        linkedin_url: linkedinUrl,
        github_url: githubUrl,
        projects: projects.filter(p => p.project_title.trim() !== "")
    };

    if (!editingAlumni) return;

    const res = await updateAlumni(editingAlumni.id, payload);

    if (res.success) {
      setIsModalOpen(false);
      resetForm();
      fetchData();
    } else {
      alert(res.error || "Action failed");
    }
  };

  const resetForm = () => {
    setEditingAlumni(null);
    setSelectedStudentId("");
    setCohortName("");
    setLinkedinUrl("");
    setGithubUrl("");
    setProjects([{ project_title: "", description: "", architecture_diagram_url: "", live_demo_url: "", repo_url: "" }]);
  };

  const filteredAlumni = alumni.filter(a => 
    a.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.cohort_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alumni Hall of Fame</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage graduates, capture capstone portfolios, and showcase excellence.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            href="/admin/academy/graduations"
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
          >
            <GraduationCap className="w-4 h-4" />
            Graduation PR Queue
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input 
          type="text" 
          placeholder="Search by name or cohort..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-card border border-border rounded-xl py-3 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAlumni.map((member) => (
            <div key={member.id} className="bg-card border border-border rounded-2xl p-6 hover:shadow-xl transition-all group relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleEditClick(member)}
                    className="p-2 bg-muted rounded-full block hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <a href={`/academy/alumni/${member.slug}`} target="_blank" className="p-2 bg-muted rounded-full block hover:bg-primary hover:text-primary-foreground transition-colors">
                    <ExternalLink className="w-4 h-4" />
                  </a>
               </div>
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase shadow-inner">
                    {member.student_name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{member.student_name}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-1">{member.cohort_name}</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <div className="flex gap-2">
                    {member.linkedin_url && (
                      <a href={member.linkedin_url} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg text-xs font-bold hover:bg-blue-500/10 hover:text-blue-500 transition-colors">
                        <Linkedin className="w-3 h-3" /> LinkedIn
                      </a>
                    )}
                    {member.github_url && (
                      <a href={member.github_url} target="_blank" className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted/50 rounded-lg text-xs font-bold hover:bg-foreground hover:text-background transition-colors">
                        <Github className="w-3 h-3" /> GitHub
                      </a>
                    )}
                  </div>
               </div>
               <div className="mt-6 pt-6 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">Graduate Id: #{member.id}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Graduation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card border border-border w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-3xl shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-xl text-primary">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{editingAlumni ? "Update Alumni Details" : "New Graduation Flow"}</h2>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                    {editingAlumni ? `Correcting Record: ${editingAlumni.student_name}` : "Transforming Student into Elite Alumni"}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Student Identity_</label>
                  <div className="w-full bg-muted border border-border rounded-xl p-3 text-sm text-muted-foreground font-bold">
                    {editingAlumni?.student_name}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Cohort Designation_</label>
                  <input 
                    required
                    type="text" 
                    placeholder="e.g. Cloud Native Cohort 1"
                    value={cohortName}
                    onChange={(e) => setCohortName(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">LinkedIn Handle_</label>
                  <input 
                    type="url" 
                    placeholder="https://linkedin.com/in/..."
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">GitHub Profile_</label>
                  <input 
                    type="url" 
                    placeholder="https://github.com/..."
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border pb-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Layout className="w-4 h-4 text-primary" />
                    Capstone Project Specs
                  </h3>
                  <button 
                    type="button"
                    onClick={handleAddProject}
                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> Add Project
                  </button>
                </div>

                <div className="space-y-8">
                  {projects.map((project, idx) => (
                    <div key={idx} className="bg-muted/20 border border-border rounded-2xl p-6 relative group/project">
                      {projects.length > 1 && (
                        <button 
                          type="button"
                          onClick={() => handleRemoveProject(idx)}
                          className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Internal Title_</label>
                          <input 
                            required
                            type="text" 
                            placeholder="e.g. Distributed Logging Infrastructure"
                            value={project.project_title}
                            onChange={(e) => handleProjectChange(idx, "project_title", e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="md:col-span-2 space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Technical Abstract (Markdown)_</label>
                          <textarea 
                            required
                            rows={4}
                            placeholder="Deep dive into the architecture, tools used, and problems solved..."
                            value={project.description}
                            onChange={(e) => handleProjectChange(idx, "description", e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none font-mono"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-primary">Architecture Diagram Asset_</label>
                          <input 
                            required
                            type="url" 
                            placeholder="CDN or Cloud Storage Link"
                            value={project.architecture_diagram_url}
                            onChange={(e) => handleProjectChange(idx, "architecture_diagram_url", e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 text-primary border-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Live Deployment URL_</label>
                          <input 
                            type="url" 
                            placeholder="Live Demo Link"
                            value={project.live_demo_url}
                            onChange={(e) => handleProjectChange(idx, "live_demo_url", e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Source Repository (GitHub)_</label>
                          <input 
                            type="url" 
                            placeholder="GitHub Repo Link"
                            value={project.repo_url}
                            onChange={(e) => handleProjectChange(idx, "repo_url", e.target.value)}
                            className="w-full bg-card border border-border rounded-xl p-3 text-sm outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 flex gap-4">
                <button 
                  type="submit"
                  className="flex-1 bg-primary text-primary-foreground py-4 rounded-2xl font-bold text-sm shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all flex items-center justify-center gap-2"
                >
                  <Code2 className="w-5 h-5" />
                  {editingAlumni ? "Re-Deploy Alumni Snapshot_" : "Compile & Transmit Profile_"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
