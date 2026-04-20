"use client";

import { useEffect, useState, useCallback } from "react";
import { 
  Calendar, 
  MapPin, 
  Video, 
  Edit3,
  ChevronRight,
  X,
  Plus,
  Trash2,
  Clock,
  Pencil,
  Check
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CourseMaterial {
  title: string;
  url: string;
}

interface ClassSession {
  id?: number;
  cohort_week_id?: number;
  title: string;
  status: 'scheduled' | 'live' | 'archived';
  visibility_status: 'locked' | 'published';
  meeting_url: string;
  scheduled_at: string;
  recording_url: string;
}

interface CohortWeek {
  id: number;
  week_number: number;
  title: string;
  recording_url?: string;
  materials?: CourseMaterial[];
  transcript?: string;
  assignment_instructions?: string;
  sessions?: ClassSession[];
}

export default function CurriculumManager() {
  const [weeks, setWeeks] = useState<CohortWeek[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWeek, setEditingWeek] = useState<CohortWeek | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newSession, setNewSession] = useState<Partial<ClassSession> | null>(null);
  const [editingSession, setEditingSession] = useState<ClassSession | null>(null);

  const fetchWeeks = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/proxy/v1/admin/academy/weeks");
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
      const res = await fetch("/api/admin/proxy/v1/admin/academy/weeks", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
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

  async function refreshWeeks() {
    const res = await fetch(`/api/admin/proxy/v1/admin/academy/weeks`);
    if (res.ok) {
      const weeksData = await res.json();
      setWeeks(weeksData);
      if (editingWeek) {
        const updatedWeek = weeksData.find((w: CohortWeek) => w.id === editingWeek.id);
        if (updatedWeek) setEditingWeek(updatedWeek);
      }
    }
  }

  async function handleAddSession() {
    if (!editingWeek || !newSession?.title) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch("/api/admin/proxy/v1/admin/academy/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newSession,
          cohort_week_id: editingWeek.id,
          status: newSession.status || 'scheduled',
          visibility_status: newSession.visibility_status || 'locked',
          meeting_url: newSession.meeting_url || '',
          scheduled_at: newSession.scheduled_at || new Date().toISOString(),
          recording_url: newSession.recording_url || ''
        }),
      });

      if (res.ok) {
        setNewSession(null);
        await refreshWeeks();
      }
    } catch (err) {
      console.error("Failed to add session", err);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleUpdateSession() {
    if (!editingSession || !editingSession.id) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/proxy/v1/admin/academy/sessions/${editingSession.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSession),
      });

      if (res.ok) {
        setEditingSession(null);
        await refreshWeeks();
      }
    } catch (err) {
      console.error("Failed to update session", err);
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleDeleteSession(sessionId: number) {
    if (!confirm("Are you sure you want to delete this session?")) return;
    
    setIsUpdating(true);
    try {
      const res = await fetch(`/api/admin/proxy/v1/admin/academy/sessions/${sessionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await refreshWeeks();
      }
    } catch (err) {
      console.error("Failed to delete session", err);
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
            <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
            
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-2 py-1 bg-muted rounded">
                Week {week.week_number}
              </span>
            </div>

            <h3 className="text-lg font-bold mb-4 line-clamp-1">{week.title}</h3>

            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span className="truncate">Deploy Lifecycle</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                <Video className="w-4 h-4" />
                <span className="truncate">{week.sessions && week.sessions.length > 0 ? `${week.sessions.length} Session(s)` : "No recordings"}</span>
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
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Module Title</label>
                  <input 
                    className="w-full p-2 bg-background border border-border rounded-md text-sm font-semibold tracking-tight"
                    value={editingWeek.title}
                    onChange={(e) => setEditingWeek({...editingWeek, title: e.target.value})}
                  />
                </div>
              </div>


              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Class Sessions</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setNewSession({ 
                      title: "", 
                      status: 'scheduled', 
                      visibility_status: 'locked',
                      meeting_url: "", 
                      scheduled_at: new Date().toISOString(),
                      recording_url: "" 
                    })} 
                    className="h-7 text-[10px] uppercase font-bold tracking-tight border-yellow-500/50 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Add New Session
                  </Button>
                </div>

                <div className="space-y-3">
                  {editingWeek.sessions?.map((sess) => (
                    editingSession?.id === sess.id ? (
                      <div key={sess.id} className="space-y-3 p-4 border-2 border-blue-500/30 rounded-xl bg-blue-500/5 anim-fade-in">
                        <div className="grid grid-cols-1 gap-3">
                          <input 
                            placeholder="Session Title"
                            className="w-full p-2 bg-background border border-border rounded text-sm font-bold"
                            value={editingSession?.title || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, title: e.target.value})}
                          />
                          <select 
                            className="w-full p-2 bg-background border border-border rounded text-sm"
                            value={editingSession?.status || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, status: e.target.value as any})}
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="live">Live</option>
                            <option value="archived">Archived</option>
                          </select>
                          <select 
                            className="w-full p-2 bg-background border border-border rounded text-sm font-bold text-yellow-500"
                            value={editingSession?.visibility_status || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, visibility_status: e.target.value as any})}
                          >
                            <option value="locked">Locked (Private)</option>
                            <option value="published">Published (Public)</option>
                          </select>
                          <input 
                            placeholder="Meeting URL"
                            className="w-full p-2 bg-background border border-border rounded text-sm"
                            value={editingSession?.meeting_url || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, meeting_url: e.target.value})}
                          />
                          <input 
                            placeholder="Recording URL"
                            className="w-full p-2 bg-background border border-border rounded text-sm"
                            value={editingSession?.recording_url || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, recording_url: e.target.value})}
                          />
                          <input 
                            type="datetime-local"
                            className="w-full p-2 bg-background border border-border rounded text-sm"
                            value={editingSession?.scheduled_at?.slice(0, 16) || ""}
                            onChange={(e) => editingSession && setEditingSession({...editingSession, scheduled_at: new Date(e.target.value).toISOString()})}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold h-9 text-xs uppercase"
                            onClick={handleUpdateSession}
                            disabled={isUpdating}
                          >
                            <Check className="w-3 h-3 mr-2" /> Update Session
                          </Button>
                          <Button 
                            variant="outline"
                            className="h-9 text-xs uppercase font-bold"
                            onClick={() => setEditingSession(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div key={sess.id} className="group flex flex-col gap-2 p-3 bg-muted/20 border border-border rounded-lg hover:border-yellow-500/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-foreground flex items-center gap-2">
                            <Clock className="w-3 h-3 text-yellow-500" />
                            {sess.title}
                          </span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setEditingSession(sess)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-yellow-500"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDeleteSession(sess.id!)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <Badge variant={sess.status === 'live' ? 'default' : sess.status === 'archived' ? 'outline' : 'secondary'} className="text-[8px] h-4 px-1 uppercase">
                              {sess.status}
                            </Badge>
                            <Badge variant={sess.visibility_status === 'published' ? 'default' : 'outline'} className={`text-[8px] h-4 px-1 uppercase ${sess.visibility_status === 'published' ? 'bg-yellow-500 text-black border-none' : ''}`}>
                              {sess.visibility_status}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground font-mono truncate">{sess.meeting_url || sess.recording_url || "No link set"}</span>
                          </div>
                          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                            {new Date(sess.scheduled_at).toLocaleDateString()} @ {new Date(sess.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    )
                  ))}

                  {newSession && (
                    <div className="space-y-3 p-4 border-2 border-yellow-500/30 rounded-xl bg-yellow-500/5 anim-fade-in">
                      <div className="grid grid-cols-1 gap-3">
                        <input 
                          placeholder="Session Title (e.g. Linux Permissions Deep Dive)"
                          className="w-full p-2 bg-background border border-border rounded text-sm font-bold"
                          value={newSession.title}
                          onChange={(e) => setNewSession({...newSession, title: e.target.value})}
                        />
                        <select 
                          className="w-full p-2 bg-background border border-border rounded text-sm"
                          value={newSession.status}
                          onChange={(e) => setNewSession({...newSession, status: e.target.value as any})}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="live">Live</option>
                          <option value="archived">Archived</option>
                        </select>
                        <select 
                          className="w-full p-2 bg-background border border-border rounded text-sm font-bold text-yellow-500"
                          value={newSession.visibility_status}
                          onChange={(e) => setNewSession({...newSession, visibility_status: e.target.value as any})}
                        >
                          <option value="locked">Locked (Private)</option>
                          <option value="published">Published (Public)</option>
                        </select>
                        <input 
                          placeholder="Meeting URL (e.g. Google Meet)"
                          className="w-full p-2 bg-background border border-border rounded text-sm"
                          value={newSession.meeting_url}
                          onChange={(e) => setNewSession({...newSession, meeting_url: e.target.value})}
                        />
                        <input 
                          placeholder="Recording URL (if archived)"
                          className="w-full p-2 bg-background border border-border rounded text-sm"
                          value={newSession.recording_url}
                          onChange={(e) => setNewSession({...newSession, recording_url: e.target.value})}
                        />
                        <input 
                          type="datetime-local"
                          className="w-full p-2 bg-background border border-border rounded text-sm"
                          value={newSession.scheduled_at?.slice(0, 16)}
                          onChange={(e) => setNewSession({...newSession, scheduled_at: new Date(e.target.value).toISOString()})}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" size="sm" onClick={handleAddSession} className="bg-yellow-500 text-black hover:bg-yellow-600 font-bold text-[10px] uppercase">Save Session</Button>
                        <Button type="button" size="sm" variant="ghost" onClick={() => setNewSession(null)} className="text-[10px] uppercase font-bold">Cancel</Button>
                      </div>
                    </div>
                  )}

                  {(!editingWeek.sessions || editingWeek.sessions.length === 0) && !newSession && (
                    <p className="text-center py-6 border border-dashed border-border rounded-lg text-xs text-muted-foreground font-medium flex flex-col items-center gap-2">
                      <Video className="w-8 h-8 opacity-20" />
                      No video recordings synced for this module.
                    </p>
                  )}
                </div>
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
