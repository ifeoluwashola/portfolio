"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Trash2, CheckCircle2, Pencil, X, Mail, Phone, MapPin, Github, Linkedin, Twitter, Briefcase, GraduationCap, Award, Code, MessageCircle } from "lucide-react";

export interface Experience {
  role: string;
  company: string;
  start_time: string;
  end_time: string;
  is_present: boolean;
  work_type: string;
  location_type: string;
  location: string;
  description: string;
}

export interface Education {
  degree: string;
  institution: string;
  start_time: string;
  end_time: string;
  program_type: string;
}

export interface Certification {
  name: string;
  year: string;
}

export interface ProfileData {
  id: number;
  bio: string;
  avatar_url: string;
  email: string;
  phone: string;
  whatsapp_number: string;
  location: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  experiences: Experience[];
  education: Education[];
  certifications: Certification[];
  technical_skills: string[];
}

function getCookie(name: string) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift();
  return null;
}

export default function AdminProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [profile, setProfile] = useState<ProfileData>({
    id: 0, bio: "", avatar_url: "", email: "", phone: "", whatsapp_number: "", location: "",
    github_url: "", linkedin_url: "", twitter_url: "", experiences: [], education: [], certifications: [], technical_skills: []
  });

  // Keep track of which section is currently being edited
  const [editKey, setEditKey] = useState<string | null>(null);

  // Draft profile used for editing any section without polluting the actual state until save
  const [draft, setDraft] = useState<ProfileData>({} as ProfileData);
  
  // Specific draft states for arrays to handle adding new ones
  const [draftExp, setDraftExp] = useState<Experience | null>(null);
  const [draftEdu, setDraftEdu] = useState<Education | null>(null);
  const [draftCert, setDraftCert] = useState<Certification | null>(null);

  const [skillsText, setSkillsText] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/profile`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      
      data.experiences = (data.experiences || []).sort((a: Experience, b: Experience) => {
        const aEnd = a.is_present ? "9999-99" : (a.end_time || a.start_time || "");
        const bEnd = b.is_present ? "9999-99" : (b.end_time || b.start_time || "");
        if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
        return (b.start_time || "").localeCompare(a.start_time || "");
      });
      
      data.education = (data.education || []).sort((a: Education, b: Education) => {
        const aEnd = a.end_time || a.start_time || "";
        const bEnd = b.end_time || b.start_time || "";
        if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
        return (b.start_time || "").localeCompare(a.start_time || "");
      });

      data.certifications = data.certifications || [];
      data.technical_skills = data.technical_skills || [];
      
      setProfile(data);
      setError("");
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  const saveProfileToServer = async (payload: ProfileData) => {
    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    const token = getCookie("auth_token");
    if (!token) {
      router.push("/admin/login");
      return false;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        if (res.status === 401) router.push("/admin/login");
        throw new Error("Failed to save profile");
      }

      setProfile(payload);
      setSuccessMsg("Updated successfully!");
      setEditKey(null);
      setTimeout(() => setSuccessMsg(""), 3000);
      return true;
      
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (key: string) => {
    setDraft(JSON.parse(JSON.stringify(profile))); // deep copy
    setEditKey(key);
    if (key === 'skills') {
      setSkillsText(profile.technical_skills.join(", "));
    }
  };

  const handleDraftChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setDraft(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveStandard = async () => {
    const payload = { ...draft };
    if (editKey === 'skills') {
      payload.technical_skills = skillsText.split(",").map(s => s.trim()).filter(Boolean);
    }
    await saveProfileToServer(payload);
  };

  const handleSaveArrayItem = async (type: 'exp' | 'edu' | 'cert', index: number) => {
    const payload = JSON.parse(JSON.stringify(profile));
    if (type === 'exp') payload.experiences[index] = draftExp;
    if (type === 'edu') payload.education[index] = draftEdu;
    if (type === 'cert') payload.certifications[index] = draftCert;
    await saveProfileToServer(payload);
  };

  const handleAddArrayItem = async (type: 'exp' | 'edu' | 'cert') => {
    const payload = JSON.parse(JSON.stringify(profile));
    if (type === 'exp') payload.experiences.unshift(draftExp);
    if (type === 'edu') payload.education.unshift(draftEdu);
    if (type === 'cert') payload.certifications.unshift(draftCert);
    
    const success = await saveProfileToServer(payload);
    if (success) fetchProfile(); // re-fetch to sort
  };

  const handleDeleteArrayItem = async (type: 'exp' | 'edu' | 'cert', index: number) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    const payload = JSON.parse(JSON.stringify(profile));
    if (type === 'exp') payload.experiences.splice(index, 1);
    if (type === 'edu') payload.education.splice(index, 1);
    if (type === 'cert') payload.certifications.splice(index, 1);
    await saveProfileToServer(payload);
  };


  if (loading) return <div className="animate-pulse flex items-center h-full">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 -mt-4 sm:-mt-8 -mx-4 sm:-mx-8 px-4 sm:px-8 py-4 bg-background/95 backdrop-blur-sm z-50 border-b border-border mb-8 shadow-sm gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-sky-500">
            Profile & Bio
          </h1>
          <p className="text-muted-foreground mt-1">Manage all public information displayed on the website.</p>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-md border border-red-500/20">{error}</div>}
      {successMsg && <div className="p-4 bg-green-500/10 text-green-500 rounded-md border border-green-500/20">{successMsg}</div>}

      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* ===================== CORE INFO ===================== */}
        <div className="bg-card border border-border/50 hover:border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-sm transition-all relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors"></div>
          
          <div className="flex justify-between items-center mb-6 relative z-10">
            <h2 className="text-xl font-bold flex items-center gap-2"><span className="w-2 h-6 bg-emerald-500 rounded-full mt-1"></span> Core Identity</h2>
            {editKey !== 'core' && (
              <button onClick={() => startEdit('core')} className="text-muted-foreground hover:text-emerald-500 flex items-center gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded-md hover:bg-emerald-500/10 transition-colors">
                <Pencil className="w-4 h-4" /> Edit
              </button>
            )}
          </div>

          {editKey === 'core' ? (
            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-sm font-medium">Avatar Picture URL</label>
                <input type="url" value={draft.avatar_url} onChange={e => handleDraftChange("avatar_url", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Bio Summary</label>
                <textarea value={draft.bio} onChange={e => handleDraftChange("bio", e.target.value)}
                  className="w-full p-3 rounded-md border border-input bg-background min-h-[120px] focus:ring-2 focus:ring-primary/50 text-sm" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setEditKey(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                <button onClick={handleSaveStandard} disabled={isSaving} className="px-4 py-2 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save</button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-muted flex-shrink-0 shadow-sm" />
              ) : (
                <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border flex-shrink-0 text-muted-foreground">No Photo</div>
              )}
              <div className="flex-1 space-y-4">
                <p className="mt-2 text-muted-foreground whitespace-pre-wrap leading-relaxed">{profile.bio || "No biography provided."}</p>
              </div>
            </div>
          )}
        </div>

        {/* ===================== CONTACT & SOCIAL ===================== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Contact */}
          <div className="bg-card border border-border/50 hover:border-sky-500/30 rounded-2xl p-6 sm:p-8 shadow-sm transition-all group">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><span className="w-2 h-6 bg-sky-500 rounded-full mt-1"></span> Contact</h2>
              {editKey !== 'contact' && (
                <button onClick={() => startEdit('contact')} className="text-muted-foreground hover:text-sky-500 flex items-center gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded-md hover:bg-sky-500/10 transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
            
            {editKey === 'contact' ? (
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-medium">Email</label><input type="email" value={draft.email} onChange={e => handleDraftChange("email", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Phone</label><input type="tel" value={draft.phone} onChange={e => handleDraftChange("phone", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">WhatsApp</label><input type="tel" value={draft.whatsapp_number} onChange={e => handleDraftChange("whatsapp_number", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Location</label><input type="text" value={draft.location} onChange={e => handleDraftChange("location", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditKey(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                  <button onClick={handleSaveStandard} disabled={isSaving} className="px-3 py-1.5 text-xs bg-sky-500 text-white hover:bg-sky-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save</button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.email && <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"><Mail className="w-4 h-4 text-sky-500" /> {profile.email}</div>}
                {profile.phone && <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"><Phone className="w-4 h-4 text-emerald-500" /> {profile.phone}</div>}
                {profile.whatsapp_number && <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"><MessageCircle className="w-4 h-4 text-green-500" /> {profile.whatsapp_number}</div>}
                {profile.location && <div className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"><MapPin className="w-4 h-4 text-rose-500" /> {profile.location}</div>}
              </div>
            )}
          </div>

          {/* Social */}
          <div className="bg-card border border-border/50 hover:border-fuchsia-500/30 rounded-2xl p-6 sm:p-8 shadow-sm transition-all group">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2"><span className="w-2 h-6 bg-fuchsia-500 rounded-full mt-1"></span> Socials</h2>
              {editKey !== 'social' && (
                <button onClick={() => startEdit('social')} className="text-muted-foreground hover:text-fuchsia-500 flex items-center gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded-md hover:bg-fuchsia-500/10 transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
            </div>
            
            {editKey === 'social' ? (
              <div className="space-y-4">
                <div className="space-y-2"><label className="text-xs font-medium">GitHub URL</label><input type="url" value={draft.github_url} onChange={e => handleDraftChange("github_url", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">LinkedIn URL</label><input type="url" value={draft.linkedin_url} onChange={e => handleDraftChange("linkedin_url", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="space-y-2"><label className="text-xs font-medium">Twitter URL</label><input type="url" value={draft.twitter_url} onChange={e => handleDraftChange("twitter_url", e.target.value)} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditKey(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                  <button onClick={handleSaveStandard} disabled={isSaving} className="px-3 py-1.5 text-xs bg-fuchsia-500 text-white hover:bg-fuchsia-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save</button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {profile.github_url && <a href={profile.github_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"><Github className="w-5 h-5 text-foreground" /> {profile.github_url}</a>}
                {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-sky-500 transition-colors"><Linkedin className="w-5 h-5 text-[#0A66C2]" /> {profile.linkedin_url}</a>}
                {profile.twitter_url && <a href={profile.twitter_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-sky-400 transition-colors"><Twitter className="w-5 h-5 text-sky-400" /> {profile.twitter_url}</a>}
              </div>
            )}
          </div>
        </div>

        {/* ===================== TECHNICAL SKILLS ===================== */}
        <div className="bg-card border border-border/50 hover:border-indigo-500/30 rounded-2xl p-6 shadow-sm transition-all group">
           <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-500"><Code className="w-5 h-5 text-indigo-500" /> Technical Skills</h2>
             {editKey !== 'skills' && (
                <button onClick={() => startEdit('skills')} className="text-muted-foreground hover:text-indigo-500 flex items-center gap-1 text-sm bg-muted/50 px-3 py-1.5 rounded-md hover:bg-indigo-500/10 transition-colors">
                  <Pencil className="w-4 h-4" /> Edit
                </button>
              )}
           </div>
           
           {editKey === 'skills' ? (
             <div className="space-y-4">
                <input type="text" value={skillsText} onChange={e => setSkillsText(e.target.value)} placeholder="e.g. Go, Kubernetes, React, Terraform" className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setEditKey(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                  <button onClick={handleSaveStandard} disabled={isSaving} className="px-3 py-1.5 text-xs bg-indigo-500 text-white hover:bg-indigo-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save</button>
                </div>
             </div>
           ) : (
             <div className="flex flex-wrap gap-2">
               {profile.technical_skills && profile.technical_skills.length > 0 ? (
                 profile.technical_skills.map((skill, i) => (
                   <span key={i} className="px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full text-sm font-medium">{skill}</span>
                 ))
               ) : (
                 <p className="text-sm text-muted-foreground">No technical skills added yet.</p>
               )}
             </div>
           )}
        </div>

        {/* ===================== EXPERIENCES ===================== */}
        <div className="bg-card border border-border/50 hover:border-amber-500/30 rounded-2xl p-6 shadow-sm transition-all group">
           <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-amber-500"><Briefcase className="w-5 h-5 text-amber-500" /> Work Experience</h2>
             <button onClick={() => { setEditKey('exp_new'); setDraftExp({ role: "", company: "", start_time: "", end_time: "", is_present: false, work_type: "Full-time", location_type: "Remote", location: "", description: "" }); }} 
               className="flex items-center gap-1.5 text-sm bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 px-4 py-2 rounded-md font-medium transition-colors">
               <Plus className="w-4 h-4" /> Add Experience
             </button>
           </div>
           
           <div className="space-y-8">
             {editKey === 'exp_new' && draftExp && (
               <div className="bg-muted/30 p-6 rounded-xl border border-amber-500/30 space-y-4 shadow-sm animate-in zoom-in-95">
                 <h3 className="font-bold text-lg mb-4">Add New Experience</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-xs">Role</label><input type="text" value={draftExp.role} onChange={e => setDraftExp({...draftExp, role: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">Company</label><input type="text" value={draftExp.company} onChange={e => setDraftExp({...draftExp, company: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">Start Date</label><input type="month" value={draftExp.start_time} onChange={e => setDraftExp({...draftExp, start_time: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">End Date</label><input type="month" value={draftExp.end_time} onChange={e => setDraftExp({...draftExp, end_time: e.target.value})} disabled={draftExp.is_present} className={`w-full h-9 px-3 rounded-md border border-input text-sm ${draftExp.is_present ? 'opacity-50' : ''}`} /></div>
                    <div className="space-y-2"><label className="text-xs">Work Type</label>
                      <select value={draftExp.work_type} onChange={e => setDraftExp({...draftExp, work_type: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm">
                        <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Freelance">Freelance</option>
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-xs">Location Type</label>
                      <select value={draftExp.location_type} onChange={e => setDraftExp({...draftExp, location_type: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm">
                        <option value="Remote">Remote</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div className="space-y-2"><label className="text-xs">Location</label><input type="text" value={draftExp.location} onChange={e => setDraftExp({...draftExp, location: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="flex items-center gap-2 mt-6">
                      <input type="checkbox" id="exp-new-pres" checked={draftExp.is_present} onChange={e => setDraftExp({...draftExp, is_present: e.target.checked, end_time: e.target.checked ? "Present" : draftExp.end_time})} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500" />
                      <label htmlFor="exp-new-pres" className="text-sm font-medium cursor-pointer">I currently work here</label>
                    </div>
                 </div>
                 <div className="space-y-2"><label className="text-xs">Description</label><textarea value={draftExp.description} onChange={e => setDraftExp({...draftExp, description: e.target.value})} className="w-full p-3 min-h-[100px] rounded-md border border-input text-sm" /></div>
                 <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setEditKey(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                    <button onClick={() => handleAddArrayItem('exp')} disabled={isSaving} className="px-4 py-2 text-sm bg-amber-500 text-white hover:bg-amber-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Add Experience</button>
                 </div>
               </div>
             )}

             {profile.experiences.map((exp, i) => (
               <div key={`read-exp-${i}`} className="relative group">
                 {editKey === `exp_${i}` && draftExp ? (
                    <div className="bg-muted/30 p-6 rounded-xl border border-amber-500/30 space-y-4 shadow-sm animate-in fade-in transition-all">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2"><label className="text-xs">Role</label><input type="text" value={draftExp.role} onChange={e => setDraftExp({...draftExp, role: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input bg-background bg-background text-sm" /></div>
                          <div className="space-y-2"><label className="text-xs">Company</label><input type="text" value={draftExp.company} onChange={e => setDraftExp({...draftExp, company: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input bg-background bg-background text-sm" /></div>
                          <div className="space-y-2"><label className="text-xs">Start Date</label><input type="month" value={draftExp.start_time} onChange={e => setDraftExp({...draftExp, start_time: e.target.value})} className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" /></div>
                          <div className="space-y-2"><label className="text-xs">End Date</label><input type="month" value={draftExp.end_time} onChange={e => setDraftExp({...draftExp, end_time: e.target.value})} disabled={draftExp.is_present} className={`w-full bg-background h-9 px-3 rounded-md border border-input text-sm ${draftExp.is_present ? 'opacity-50' : ''}`} /></div>
                          <div className="space-y-2"><label className="text-xs">Work Type</label>
                            <select value={draftExp.work_type} onChange={e => setDraftExp({...draftExp, work_type: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm">
                              <option value="Full-time">Full-time</option><option value="Part-time">Part-time</option><option value="Contract">Contract</option><option value="Freelance">Freelance</option>
                            </select>
                          </div>
                          <div className="space-y-2"><label className="text-xs">Location Type</label>
                            <select value={draftExp.location_type} onChange={e => setDraftExp({...draftExp, location_type: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm">
                              <option value="Remote">Remote</option><option value="On-site">On-site</option><option value="Hybrid">Hybrid</option>
                            </select>
                          </div>
                          <div className="space-y-2"><label className="text-xs">Location</label><input type="text" value={draftExp.location} onChange={e => setDraftExp({...draftExp, location: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                          <div className="flex items-center gap-2 mt-6">
                            <input type="checkbox" id={`exp-pres-${i}`} checked={draftExp.is_present} onChange={e => setDraftExp({...draftExp, is_present: e.target.checked, end_time: e.target.checked ? "Present" : draftExp.end_time})} className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500" />
                            <label htmlFor={`exp-pres-${i}`} className="text-sm font-medium cursor-pointer">I currently work here</label>
                          </div>
                      </div>
                      <div className="space-y-2"><label className="text-xs">Description</label><textarea value={draftExp.description} onChange={e => setDraftExp({...draftExp, description: e.target.value})} className="w-full bg-background p-3 min-h-[100px] rounded-md border border-input text-sm" /></div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button onClick={() => setEditKey(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                          <button onClick={() => handleSaveArrayItem('exp', i)} disabled={isSaving} className="px-4 py-2 text-sm bg-amber-500 text-white hover:bg-amber-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save Changes</button>
                      </div>
                    </div>
                 ) : (
                   <div className="pl-6 border-l-2 border-muted pb-8 last:pb-0 relative hover:border-amber-500/50 transition-colors">
                     <div className="absolute w-3 h-3 bg-primary rounded-full -left-[7px] top-1.5 ring-4 ring-background"></div>
                     
                     <div className="absolute right-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-background p-1 rounded-md border border-border/50 shadow-sm">
                        <button onClick={() => { setEditKey(`exp_${i}`); setDraftExp(JSON.parse(JSON.stringify(exp))); }} className="p-1.5 text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => handleDeleteArrayItem('exp', i)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                     </div>

                     <h3 className="font-bold text-lg text-foreground pr-20">{exp.role}</h3>
                     <div className="text-primary font-medium">{exp.company}</div>
                     <p className="text-sm text-muted-foreground mt-1 mb-3">
                       {exp.start_time} - {exp.is_present ? "Present" : exp.end_time} • {exp.work_type} • {exp.location_type}
                     </p>
                     {exp.description && <p className="text-sm mt-2 whitespace-pre-wrap leading-relaxed text-muted-foreground">{exp.description}</p>}
                   </div>
                 )}
               </div>
             ))}
             {profile.experiences.length === 0 && editKey !== 'exp_new' && <p className="text-muted-foreground text-sm text-center py-6">No experiences added yet.</p>}
           </div>
        </div>

        {/* ===================== EDUCATION ===================== */}
        <div className="bg-card border border-border/50 hover:border-emerald-500/30 rounded-2xl p-6 shadow-sm transition-all group">
           <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-emerald-500"><GraduationCap className="w-5 h-5 text-emerald-500" /> Education</h2>
             <button onClick={() => { setEditKey('edu_new'); setDraftEdu({ degree: "", institution: "", start_time: "", end_time: "", program_type: "On-site" }); }} 
               className="flex items-center gap-1.5 text-sm bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-4 py-2 rounded-md font-medium transition-colors">
               <Plus className="w-4 h-4" /> Add Education
             </button>
           </div>
           
           <div className="space-y-6">
             {editKey === 'edu_new' && draftEdu && (
               <div className="bg-muted/30 p-6 rounded-xl border border-emerald-500/30 space-y-4 shadow-sm animate-in zoom-in-95">
                 <h3 className="font-bold text-lg mb-4">Add New Education</h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><label className="text-xs">Institution</label><input type="text" value={draftEdu.institution} onChange={e => setDraftEdu({...draftEdu, institution: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">Degree / Course</label><input type="text" value={draftEdu.degree} onChange={e => setDraftEdu({...draftEdu, degree: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">Start Date</label><input type="month" value={draftEdu.start_time} onChange={e => setDraftEdu({...draftEdu, start_time: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">End Date</label><input type="month" value={draftEdu.end_time} onChange={e => setDraftEdu({...draftEdu, end_time: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                    <div className="space-y-2"><label className="text-xs">Program Type</label>
                      <select value={draftEdu.program_type} onChange={e => setDraftEdu({...draftEdu, program_type: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm">
                        <option value="On-site">On-site</option><option value="Distance Learning">Distance Learning</option><option value="Online">Online</option>
                      </select>
                    </div>
                 </div>
                 <div className="flex justify-end gap-2 pt-2">
                    <button onClick={() => setEditKey(null)} className="px-4 py-2 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                    <button onClick={() => handleAddArrayItem('edu')} disabled={isSaving} className="px-4 py-2 text-sm bg-emerald-500 text-white hover:bg-emerald-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Add Education</button>
                 </div>
               </div>
             )}

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {profile.education.map((edu, i) => (
                 <div key={`read-edu-${i}`} className="relative group">
                   {editKey === `edu_${i}` && draftEdu ? (
                      <div className="bg-muted/30 p-5 rounded-xl border border-emerald-500/30 space-y-4 shadow-sm animate-in fade-in transition-all md:col-span-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2"><label className="text-xs">Institution</label><input type="text" value={draftEdu.institution} onChange={e => setDraftEdu({...draftEdu, institution: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs">Degree</label><input type="text" value={draftEdu.degree} onChange={e => setDraftEdu({...draftEdu, degree: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs">Start</label><input type="month" value={draftEdu.start_time} onChange={e => setDraftEdu({...draftEdu, start_time: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs">End</label><input type="month" value={draftEdu.end_time} onChange={e => setDraftEdu({...draftEdu, end_time: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                            <div className="space-y-2"><label className="text-xs">Type</label>
                              <select value={draftEdu.program_type} onChange={e => setDraftEdu({...draftEdu, program_type: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm">
                                <option value="On-site">On-site</option><option value="Distance Learning">Distance Learning</option><option value="Online">Online</option>
                              </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setEditKey(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors">Cancel</button>
                            <button onClick={() => handleSaveArrayItem('edu', i)} disabled={isSaving} className="px-3 py-1.5 text-xs bg-emerald-500 text-white hover:bg-emerald-600 rounded-md transition-colors shadow-sm disabled:opacity-50">Save</button>
                        </div>
                      </div>
                   ) : (
                     <div className="p-5 border border-border rounded-xl bg-muted/20 hover:bg-muted/40 hover:border-emerald-500/30 transition-colors h-full flex flex-col relative group overflow-hidden">
                       <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 bg-background/80 p-0.5 rounded-md backdrop-blur-sm shadow-sm">
                          <button onClick={() => { setEditKey(`edu_${i}`); setDraftEdu(JSON.parse(JSON.stringify(edu))); }} className="p-1.5 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-md transition-colors"><Pencil className="w-4 h-4" /></button>
                          <button onClick={() => handleDeleteArrayItem('edu', i)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                       </div>
                       
                       <h3 className="font-bold text-lg text-foreground pr-16">{edu.degree}</h3>
                       <p className="text-primary font-medium">{edu.institution}</p>
                       <p className="text-sm text-muted-foreground mt-auto pt-4 flex justify-between items-center">
                         <span>{edu.start_time} - {edu.end_time || "N/A"}</span>
                         <span className="px-2 py-0.5 bg-background border border-border rounded-md text-xs">{edu.program_type}</span>
                       </p>
                     </div>
                   )}
                 </div>
               ))}
               {profile.education.length === 0 && editKey !== 'edu_new' && <p className="text-muted-foreground text-sm col-span-2 text-center py-4">No education history added yet.</p>}
             </div>
           </div>
        </div>

        {/* ===================== CERTIFICATIONS ===================== */}
        <div className="bg-card border border-border/50 hover:border-rose-500/30 rounded-2xl p-6 shadow-sm transition-all group">
           <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
             <h2 className="text-2xl font-bold flex items-center gap-2 text-rose-500"><Award className="w-5 h-5 text-rose-500" /> Certifications</h2>
             <button onClick={() => { setEditKey('cert_new'); setDraftCert({ name: "", year: "" }); }} 
               className="flex items-center gap-1.5 text-sm bg-rose-500/10 text-rose-600 hover:bg-rose-500/20 px-4 py-2 rounded-md font-medium transition-colors">
               <Plus className="w-4 h-4" /> Add Certification
             </button>
           </div>
           
           <div className="space-y-4">
             {editKey === 'cert_new' && draftCert && (
               <div className="bg-muted/30 p-4 rounded-xl border border-rose-500/30 flex flex-col md:flex-row gap-4 shadow-sm items-end animate-in zoom-in-95">
                 <div className="space-y-2 flex-grow w-full"><label className="text-xs">Certification Name</label><input type="text" value={draftCert.name} onChange={e => setDraftCert({...draftCert, name: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                 <div className="space-y-2 w-full md:w-32"><label className="text-xs">Year</label><input type="number" min="1990" max="2099" value={draftCert.year} onChange={e => setDraftCert({...draftCert, year: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                 <div className="flex gap-2 w-full md:w-auto mt-4 md:mt-0 pb-0.5">
                    <button onClick={() => setEditKey(null)} className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted rounded-md transition-colors w-full md:w-auto">Cancel</button>
                    <button onClick={() => handleAddArrayItem('cert')} disabled={isSaving} className="px-3 py-1.5 text-xs bg-rose-500 text-white hover:bg-rose-600 rounded-md transition-colors shadow-sm disabled:opacity-50 w-full md:w-auto">Add</button>
                 </div>
               </div>
             )}

             <div className="flex flex-wrap gap-4">
               {profile.certifications.map((cert, i) => (
                 <div key={`read-cert-${i}`} className="w-full md:w-auto">
                   {editKey === `cert_${i}` && draftCert ? (
                      <div className="bg-muted/30 p-4 rounded-xl border border-rose-500/30 flex flex-col sm:flex-row gap-4 shadow-sm items-end animate-in fade-in transition-all">
                        <div className="space-y-2 flex-grow"><label className="text-xs">Name</label><input type="text" value={draftCert.name} onChange={e => setDraftCert({...draftCert, name: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                        <div className="space-y-2 w-full sm:w-24"><label className="text-xs">Year</label><input type="number" value={draftCert.year} onChange={e => setDraftCert({...draftCert, year: e.target.value})} className="w-full bg-background h-9 px-3 rounded-md border border-input text-sm" /></div>
                        <div className="flex gap-2 sm:mb-0.5">
                          <button onClick={() => setEditKey(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-md transition-colors"><X className="w-4 h-4" /></button>
                          <button onClick={() => handleSaveArrayItem('cert', i)} disabled={isSaving} className="p-2 bg-rose-500 text-white hover:bg-rose-600 rounded-md transition-colors"><CheckCircle2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                   ) : (
                     <div className="flex items-center gap-4 p-4 pr-12 border border-border rounded-xl bg-muted/20 hover:bg-muted/40 hover:border-rose-500/30 transition-colors w-full md:w-auto relative group">
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 bg-background/80 p-0.5 rounded-md backdrop-blur-sm shadow-sm">
                          <button onClick={() => { setEditKey(`cert_${i}`); setDraftCert(JSON.parse(JSON.stringify(cert))); }} className="p-1.5 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 rounded-md transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteArrayItem('cert', i)} className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                       </div>
                       
                       <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                         <Award className="w-5 h-5 text-primary" />
                       </div>
                       <div className="pr-4">
                         <h3 className="font-bold text-sm sm:text-base text-foreground leading-tight">{cert.name}</h3>
                         <p className="text-xs sm:text-sm text-muted-foreground mt-1">Issued: {cert.year}</p>
                       </div>
                     </div>
                   )}
                 </div>
               ))}
             </div>
             {profile.certifications.length === 0 && editKey !== 'cert_new' && <p className="text-muted-foreground text-sm py-4">No certifications added yet.</p>}
           </div>
        </div>

      </div>
    </div>
  );
}
