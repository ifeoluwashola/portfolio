"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, 
  MapPin, 
  Video, 
  Edit3,
  ChevronRight,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseMaterial {
  title: string;
  url: string;
}

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  status: 'locked' | 'pre-flight' | 'live' | 'archived';
  meet_link?: string;
  recording_url?: string;
  materials?: CourseMaterial[];
  transcript?: string;
  assignment_instructions?: string;
}

export default function CurriculumManager() {
  const [weeks, setWeeks] = useState<CohortWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<CohortWeek | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchWeeks = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"}/v1/admin/academy/weeks`, {
        headers: {
          Authorization: `Bearer ${getCookie("auth_token")}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setWeeks(data);
      }
    } catch (err) {
      console.error("Failed to fetch weeks", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWeeks();
  }, [fetchWeeks]);

  async function handleUpdateWeek(e: React.FormEvent) {
    e.preventDefault();
    if (!editingWeek) return;

    setIsUpdating(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api"}/v1/admin/academy/weeks`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getCookie("auth_token")}`,
        },
        body: JSON.stringify(editingWeek),
      });

      if (res.ok) {
        setEditingWeek(null);
        fetchWeeks();
      }
    } catch (err) {
      console.error("Update failed", err);
    } finally {
      setIsUpdating(false);
    }
  }

  const addMaterial = () => {
    if (!editingWeek) return;
    const newMaterials = [...(editingWeek.materials || []), { title: "", url: "" }];
    setEditingWeek({ ...editingWeek, materials: newMaterials });
  };

  const removeMaterial = (index: number) => {
    if (!editingWeek) return;
    const newMaterials = editingWeek.materials?.filter((_, i) => i !== index);
    setEditingWeek({ ...editingWeek, materials: newMaterials });
  };

  const updateMaterial = (index: number, field: keyof CourseMaterial, value: string) => {
    if (!editingWeek || !editingWeek.materials) return;
    const newMaterials = [...editingWeek.materials];
    newMaterials[index] = { ...newMaterials[index], [field]: value };
    setEditingWeek({ ...editingWeek, materials: newMaterials });
  };

  function getCookie(name: string) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  }

  if (loading) return <div className="p-8 animate-pulse text-muted-foreground font-bold tracking-tight">Initializing curriculum manager...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Curriculum Manager</h1>
          <p className="text-muted-foreground">Orchestrate the 12-week deployment cycle and module states.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-lg border border-border">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Cohort #1 (Spring 2026)</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {weeks.map((week) => (
          <div key={week.id} className="group bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-all relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${
              week.status === 'live' ? 'bg-emerald-500' : 
              week.status === 'pre-flight' ? 'bg-amber-500' :
              week.status === 'archived' ? 'bg-sky-500' : 'bg-muted'
            }`} />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded">
                Week {week.week_number}
              </span>
              <Badge variant={
                week.status === 'live' ? 'default' : 
                week.status === 'pre-flight' ? 'secondary' :
                week.status === 'archived' ? 'outline' : 'outline'
              } className="capitalize">
                {week.status}
              </Badge>
            </div>

            <h3 className="text-lg font-bold mb-4 line-clamp-1">{week.title}</h3>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span className="truncate">{week.meet_link || "No live link set"}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Video className="w-4 h-4" />
                <span className="truncate">{week.recording_url || "No recording available"}</span>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full gap-2 border-primary/20 hover:bg-primary hover:text-primary-foreground group"
              onClick={() => setEditingWeek(week)}
            >
              <Edit3 className="w-4 h-4" />
              Modify Deployment
              <ChevronRight className="w-4 h-4 ml-auto group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingWeek && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
          <div className="my-8 bg-card w-full max-w-2xl border border-border rounded-2xl shadow-2xl overflow-hidden relative">
            <button 
              onClick={() => setEditingWeek(null)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="p-6 border-b border-border bg-muted/30">
              <h2 className="text-xl font-bold tracking-tight uppercase">Module Management: Week {editingWeek.week_number}</h2>
              <p className="text-sm text-muted-foreground mt-1">Configure live environment, materials, and recording metadata.</p>
            </div>
            
            <form onSubmit={handleUpdateWeek} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Title</label>
                  <input 
                    className="w-full p-2 bg-background border border-border rounded-md text-sm font-semibold tracking-tight"
                    value={editingWeek.title}
                    onChange={(e) => setEditingWeek({...editingWeek, title: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deployment Status</label>
                  <select 
                    className="w-full p-2 bg-background border border-border rounded-md text-sm font-medium"
                    value={editingWeek.status}
                    onChange={(e) => setEditingWeek({...editingWeek, status: e.target.value as CohortWeek['status']})}
                  >
                    <option value="locked">Locked</option>
                    <option value="pre-flight">Pre-flight</option>
                    <option value="live">Live (Active Session)</option>
                    <option value="archived">Archived (Session Over)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Live Meeting URL</label>
                <input 
                  type="url"
                  className="w-full p-2 bg-background border border-border rounded-md text-sm font-medium"
                  placeholder="https://meet.google.com/..."
                  value={editingWeek.meet_link || ""}
                  onChange={(e) => setEditingWeek({...editingWeek, meet_link: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Recording Link</label>
                <input 
                  type="url"
                  className="w-full p-2 bg-background border border-border rounded-md text-sm font-medium"
                  placeholder="https://drive.google.com/..."
                  value={editingWeek.recording_url || ""}
                  onChange={(e) => setEditingWeek({...editingWeek, recording_url: e.target.value})}
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Course Materials</label>
                  <Button type="button" variant="outline" size="sm" onClick={addMaterial} className="h-7 text-[10px] uppercase font-bold tracking-tight">Add Link</Button>
                </div>
                <div className="space-y-3">
                  {(editingWeek.materials || []).map((mat, index) => (
                    <div key={index} className="flex gap-2 items-start">
                      <div className="flex-1 space-y-2 text-sm">
                        <input 
                          placeholder="Material Name (e.g. Linux Docs)"
                          className="w-full p-1.5 bg-background border border-border rounded text-xs font-semibold tracking-tight"
                          value={mat.title}
                          onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                        />
                        <input 
                          placeholder="URL"
                          className="w-full p-1.5 bg-background border border-border rounded text-xs font-medium"
                          value={mat.url}
                          onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                        />
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(index)} className="text-muted-foreground hover:text-destructive">×</Button>
                    </div>
                  ))}
                  {(!editingWeek.materials || editingWeek.materials.length === 0) && (
                    <p className="text-center py-4 border border-dashed border-border rounded-lg text-xs text-muted-foreground font-medium">No supplementary materials tagged to this module.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assignment Instructions <span className="text-muted-foreground/50">(Markdown Supported)</span></label>
                <textarea 
                  className="w-full min-h-[160px] p-4 bg-background border border-border rounded-md text-sm font-mono leading-relaxed"
                  placeholder={`## Objective\nDescribe the lab assignment here...\n\n### Requirements\n- Requirement 1\n- Requirement 2\n\n### Submission\nSubmit your PR link below.`}
                  value={editingWeek.assignment_instructions || ""}
                  onChange={(e) => setEditingWeek({...editingWeek, assignment_instructions: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Session Transcript</label>
                <textarea 
                  className="w-full min-h-[120px] p-4 bg-background border border-border rounded-md text-sm font-medium leading-relaxed"
                  placeholder="Paste session notes or automated transcript here..."
                  value={editingWeek.transcript || ""}
                  onChange={(e) => setEditingWeek({...editingWeek, transcript: e.target.value})}
                />
              </div>

              <div className="flex gap-3 pt-4 border-t border-border">
                <Button 
                  type="button" 
                  variant="ghost" 
                  className="flex-1 font-bold text-xs uppercase"
                  onClick={() => setEditingWeek(null)}
                  disabled={isUpdating}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 font-bold text-xs uppercase underline underline-offset-4 decoration-primary"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Applying Changes..." : "Update Module"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
