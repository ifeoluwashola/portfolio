"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PenSquare, Trash2, X } from "lucide-react";

interface Project {
  id: number;
  title: string;
  description: string;
  tags: string[];
  githubUrl?: string;
  caseStudyUrl?: string;
}

// Helper to get cookie value
function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  // Form State
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [caseStudyUrl, setCaseStudyUrl] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects`);
      if (!res.ok) throw new Error("Failed to fetch projects");
      const data = await res.json();
      setProjects(data || []);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleEditClick = (project: Project) => {
    setEditingProjectId(project.id);
    setTitle(project.title);
    setDescription(project.description);
    setTags(project.tags ? project.tags.join(", ") : "");
    setGithubUrl(project.githubUrl || "");
    setCaseStudyUrl(project.caseStudyUrl || "");
    
    // Scroll to form on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingProjectId(null);
    setTitle("");
    setDescription("");
    setTags("");
    setGithubUrl("");
    setCaseStudyUrl("");
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const token = getCookie("auth_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    const payload = {
      title,
      description,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      githubUrl: githubUrl || undefined,
      caseStudyUrl: caseStudyUrl || undefined,
    };

    try {
      const url = editingProjectId 
        ? `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects/${editingProjectId}`
        : `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects`;
      
      const method = editingProjectId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        const errData = await res.json();
        throw new Error(errData.error || `Failed to ${editingProjectId ? "update" : "add"} project`);
      }

      // Reset form and reload
      handleCancelEdit();
      await fetchProjects();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError(String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (id: number) => {
    if (!confirm("Are you sure you want to delete this project?")) return;

    const token = getCookie("auth_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/projects/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push("/admin/login");
          return;
        }
        throw new Error("Failed to delete project");
      }

      // If we deleted the project we are currently editing, cancel edit mode
      if (editingProjectId === id) {
        handleCancelEdit();
      }

      await fetchProjects();
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert(String(err));
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Manage Projects</h1>
        <p className="text-muted-foreground">Add new portfolio showcases or edit existing ones.</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-500/10 p-4 border border-red-500/20 text-red-500 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
        
        {/* Project Form (Starts on left for emphasis when editing) */}
        <div className={`p-6 rounded-xl border border-border h-fit md:col-span-1 lg:col-span-2 shadow-sm transition-all ${editingProjectId ? 'bg-sky-500/5 border-sky-500/30' : 'bg-muted/30'}`}>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              {editingProjectId ? (
                <>
                  <PenSquare className="w-5 h-5 text-sky-500" /> 
                  Edit Project
                </>
              ) : "Add New Project"}
            </h2>
            {editingProjectId && (
              <button onClick={handleCancelEdit} className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1">
                <X className="w-4 h-4" /> Cancel
              </button>
            )}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description *</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tags (comma separated) *</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g. Go, React, PostgreSQL"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub Repository URL</label>
              <input
                type="url"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                placeholder="https://github.com/..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Case Study/Live Demo URL</label>
              <input
                type="url"
                value={caseStudyUrl}
                onChange={(e) => setCaseStudyUrl(e.target.value)}
                placeholder="https://..."
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`inline-flex items-center justify-center rounded-md text-sm font-medium text-primary-foreground h-10 px-4 py-2 w-full mt-4 transition-colors ${
                editingProjectId ? 'bg-sky-600 hover:bg-sky-700' : 'bg-primary hover:bg-primary/90'
              }`}
            >
              {isSubmitting 
                ? (editingProjectId ? "Saving..." : "Adding...") 
                : (editingProjectId ? "Save Changes" : "Publish Project")}
            </button>
          </form>
        </div>

        {/* Project List */}
        <div className="space-y-4 md:col-span-1 lg:col-span-3">
          <h2 className="text-xl font-semibold">Current Projects</h2>
          
          {loading ? (
            <div className="text-muted-foreground animate-pulse">Loading projects...</div>
          ) : projects.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-border rounded-lg text-muted-foreground">
              No projects found. Add one to get started.
            </div>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <div 
                  key={project.id} 
                  className={`flex flex-col sm:flex-row justify-between p-5 border rounded-lg bg-card gap-4 transition-all ${
                    editingProjectId === project.id ? 'border-sky-500 shadow-sm ring-1 ring-sky-500/50' : 'border-border'
                  }`}
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {project.tags?.map((tag, idx) => (
                        <span key={idx} className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-sm">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-start gap-4 sm:gap-2 mt-4 sm:mt-0">
                    <button
                      onClick={() => handleEditClick(project)}
                      className="text-sm text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1.5"
                    >
                      <PenSquare className="w-4 h-4" /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteProject(project.id)}
                      className="text-sm text-destructive hover:text-red-700 font-medium flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
