"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2 } from "lucide-react";

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
    id: 0,
    bio: "",
    avatar_url: "",
    email: "",
    phone: "",
    whatsapp_number: "",
    location: "",
    github_url: "",
    linkedin_url: "",
    twitter_url: "",
    experiences: [],
    education: [],
    certifications: [],
    technical_skills: []
  });

  const [skillsText, setSkillsText] = useState("");

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8081/api"}/profile`);
      if (!res.ok) throw new Error("Failed to load profile");
      const data = await res.json();
      
      data.experiences = data.experiences || [];
      data.education = data.education || [];
      data.certifications = data.certifications || [];
      data.technical_skills = data.technical_skills || [];
      
      setProfile(data);
      setSkillsText(data.technical_skills.join(", "));
      setError(""); // Clear any prior fetch errors
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [router]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccessMsg("");

    const token = getCookie("auth_token");
    if (!token) {
      router.push("/admin/login");
      return;
    }

    try {
      const payload = {
        ...profile,
        technical_skills: skillsText.split(",").map(s => s.trim()).filter(Boolean)
      };

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

      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
      
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = <K extends keyof ProfileData>(field: K, value: ProfileData[K]) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  // Array Handlers
  const addExperience = () => {
    setProfile(prev => ({
      ...prev,
      experiences: [
        { role: "", company: "", start_time: "", end_time: "", is_present: false, work_type: "Full-time", location_type: "Remote", location: "", description: "" },
        ...prev.experiences
      ]
    }));
  };

  const updateExperience = <K extends keyof Experience>(index: number, field: K, value: Experience[K]) => {
    setProfile(prev => {
      const updated = [...prev.experiences];
      updated[index] = { ...updated[index], [field]: value };
      if (field === "is_present" && value === true) {
        updated[index].end_time = "Present";
      }
      return { ...prev, experiences: updated };
    });
  };

  const removeExperience = (index: number) => {
    setProfile(prev => ({
      ...prev,
      experiences: prev.experiences.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    setProfile(prev => ({
      ...prev,
      education: [
        { degree: "", institution: "", start_time: "", end_time: "", program_type: "On-site" },
        ...prev.education
      ]
    }));
  };

  const updateEducation = <K extends keyof Education>(index: number, field: K, value: Education[K]) => {
    setProfile(prev => {
      const updated = [...prev.education];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, education: updated };
    });
  };

  const removeEducation = (index: number) => {
    setProfile(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    setProfile(prev => ({
      ...prev,
      certifications: [
        { name: "", year: "" },
        ...prev.certifications
      ]
    }));
  };

  const updateCertification = <K extends keyof Certification>(index: number, field: K, value: Certification[K]) => {
    setProfile(prev => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, certifications: updated };
    });
  };

  const removeCertification = (index: number) => {
    setProfile(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  if (loading) return <div className="animate-pulse flex items-center h-full">Loading profile editor...</div>;

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      <div className="flex items-center justify-between sticky top-0 -mt-8 -mx-8 px-8 py-4 bg-background/95 backdrop-blur-sm z-50 border-b border-border mb-8 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">Manage all public information displayed on the website.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to discard your unsaved changes?")) {
                fetchProfile();
              }
            }}
            disabled={isSaving}
            className="text-muted-foreground hover:text-foreground px-4 py-2 font-medium text-sm transition-colors"
          >
            Discard
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isSaving ? "Saving..." : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-500/10 text-red-500 rounded-md border border-red-500/20">{error}</div>}
      {successMsg && <div className="p-4 bg-green-500/10 text-green-500 rounded-md border border-green-500/20">{successMsg}</div>}

      <form className="space-y-8" onSubmit={handleSave}>
        
        {/* Core Info */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Core Identifier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Bio Summary</label>
              <textarea 
                value={profile.bio} 
                onChange={e => handleInputChange("bio", e.target.value)}
                className="w-full mt-1 p-3 rounded-md border border-input bg-background min-h-[120px] focus:ring-2 focus:ring-primary/50 text-sm"
                placeholder="A brief summary about who you are and what you do."
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium">Avatar Picture URL</label>
              <input 
                type="url" value={profile.avatar_url} onChange={e => handleInputChange("avatar_url", e.target.value)}
                placeholder="https://example.com/my-photo.jpg"
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
              <p className="text-xs text-muted-foreground">Provide a link to your hosted portrait image for your profile page visibility.</p>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <input 
                type="email" value={profile.email} onChange={e => handleInputChange("email", e.target.value)}
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <input 
                type="tel" value={profile.phone} onChange={e => handleInputChange("phone", e.target.value)}
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp Number (inc. country code)</label>
              <input 
                type="tel" value={profile.whatsapp_number} onChange={e => handleInputChange("whatsapp_number", e.target.value)}
                placeholder="+234..."
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Location</label>
              <input 
                type="text" value={profile.location} onChange={e => handleInputChange("location", e.target.value)}
                className="w-full mt-1 h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Social Links */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Social Presence</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">GitHub URL</label>
              <input 
                type="url" value={profile.github_url} onChange={e => handleInputChange("github_url", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">LinkedIn URL</label>
              <input 
                type="url" value={profile.linkedin_url} onChange={e => handleInputChange("linkedin_url", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Twitter / X URL</label>
              <input 
                type="url" value={profile.twitter_url} onChange={e => handleInputChange("twitter_url", e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Technical Skills */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Technical Skills</h2>
          <p className="text-sm text-muted-foreground mb-4">Provide a comma-separated list of your technical arsenal.</p>
          <input 
            type="text" value={skillsText} onChange={e => setSkillsText(e.target.value)}
            placeholder="e.g. Go, Kubernetes, React, Terraform"
            className="w-full h-10 px-3 rounded-md border border-input bg-background focus:ring-2 focus:ring-primary/50 text-sm"
          />
        </div>

        {/* Experiences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Work Experience</h2>
            <button type="button" onClick={addExperience} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium bg-primary/10 px-3 py-1.5 rounded-md">
              <Plus className="w-4 h-4" /> Add Experience
            </button>
          </div>
          
          {profile.experiences.map((exp, idx) => (
            <div key={`exp-${idx}`} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 relative">
              <button type="button" onClick={() => removeExperience(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Role / Title</label>
                  <input type="text" value={exp.role} onChange={e => updateExperience(idx, "role", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company</label>
                  <input type="text" value={exp.company} onChange={e => updateExperience(idx, "company", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required />
                </div>

                {/* Dates & Types */}
                <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Start Date</label>
                     <input type="month" value={exp.start_time} onChange={e => updateExperience(idx, "start_time", e.target.value)}
                       className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                   </div>
                   <div className="space-y-2 flex flex-col justify-end">
                     {exp.is_present ? (
                        <div className="w-full h-10 px-3 flex items-center rounded-md border-border bg-muted/50 text-sm text-foreground/50 border cursor-not-allowed">Present</div>
                     ) : (
                        <div className="space-y-2">
                          <label className="text-sm font-medium">End Date</label>
                          <input type="month" value={exp.end_time} onChange={e => updateExperience(idx, "end_time", e.target.value)}
                            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                        </div>
                     )}
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Work Type</label>
                     <select value={exp.work_type} onChange={e => updateExperience(idx, "work_type", e.target.value)}
                       className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                       <option value="Full-time">Full-time</option>
                       <option value="Part-time">Part-time</option>
                       <option value="Contract">Contract</option>
                       <option value="Freelance">Freelance</option>
                       <option value="Internship">Internship</option>
                     </select>
                   </div>
                   <div className="space-y-2">
                     <label className="text-sm font-medium">Location Type</label>
                     <select value={exp.location_type} onChange={e => updateExperience(idx, "location_type", e.target.value)}
                       className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                       <option value="Remote">Remote</option>
                       <option value="On-site">On-site</option>
                       <option value="Hybrid">Hybrid</option>
                     </select>
                   </div>
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <input type="text" value={exp.location || ""} onChange={e => updateExperience(idx, "location", e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                  </div>
                  <div className="flex items-center gap-2 md:mt-8">
                     <input type="checkbox" id={`present-${idx}`} checked={exp.is_present} onChange={e => updateExperience(idx, "is_present", e.target.checked)}
                       className="rounded border-input text-primary focus:ring-primary w-4 h-4 cursor-pointer pt-1" />
                     <label htmlFor={`present-${idx}`} className="text-sm font-medium cursor-pointer">I currently work here</label>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <textarea value={exp.description} onChange={e => updateExperience(idx, "description", e.target.value)}
                    className="w-full mt-1 p-3 rounded-md border border-input bg-background min-h-[100px] text-sm"
                    placeholder="Describe your responsibilities and achievements..." />
                </div>
              </div>
            </div>
          ))}
          {profile.experiences.length === 0 && (
            <div className="text-center p-8 bg-muted/20 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No experiences added yet.</p>
            </div>
          )}
        </div>

        {/* Education */}
        <div className="space-y-4 pt-6 mt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Education</h2>
            <button type="button" onClick={addEducation} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium bg-primary/10 px-3 py-1.5 rounded-md">
              <Plus className="w-4 h-4" /> Add Education
            </button>
          </div>
          
          {profile.education.map((edu, idx) => (
            <div key={`edu-${idx}`} className="bg-card border border-border rounded-xl p-6 shadow-sm space-y-6 relative">
              <button type="button" onClick={() => removeEducation(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Institution Name</label>
                  <input type="text" value={edu.institution} onChange={e => updateEducation(idx, "institution", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Course / Degree</label>
                  <input type="text" value={edu.degree} onChange={e => updateEducation(idx, "degree", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date</label>
                  <input type="month" value={edu.start_time} onChange={e => updateEducation(idx, "start_time", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Expected / End Date</label>
                  <input type="month" value={edu.end_time} onChange={e => updateEducation(idx, "end_time", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
                </div>
                
                <div className="space-y-2 md:col-span-2 max-w-xs">
                  <label className="text-sm font-medium">Program Type</label>
                  <select value={edu.program_type} onChange={e => updateEducation(idx, "program_type", e.target.value)}
                    className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm">
                    <option value="On-site">On-site</option>
                    <option value="Distance Learning">Distance Learning</option>
                    <option value="Online">Online</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
          {profile.education.length === 0 && (
            <div className="text-center p-8 bg-muted/20 border border-dashed border-border rounded-xl">
              <p className="text-muted-foreground text-sm">No education history added yet.</p>
            </div>
          )}
        </div>

        {/* Certifications */}
        <div className="space-y-4 pt-6 mt-6 border-t border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight">Certifications</h2>
            <button type="button" onClick={addCertification} className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium bg-primary/10 px-3 py-1.5 rounded-md">
              <Plus className="w-4 h-4" /> Add Certification
            </button>
          </div>
          
          {profile.certifications.map((cert, idx) => (
            <div key={`cert-${idx}`} className="bg-card border border-border rounded-xl p-4 shadow-sm flex items-end gap-4 relative">
              <button type="button" onClick={() => removeCertification(idx)} className="absolute top-4 right-4 text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="w-5 h-5" />
              </button>
              
              <div className="space-y-2 flex-grow pr-10">
                <label className="text-sm font-medium">Certification Name</label>
                <input type="text" value={cert.name} onChange={e => updateCertification(idx, "name", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" required />
              </div>
              <div className="space-y-2 w-32 pb-6">
                <label className="text-sm font-medium">Year Issued</label>
                <input type="number" min="1990" max="2099" value={cert.year} onChange={e => updateCertification(idx, "year", e.target.value)}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" />
              </div>
            </div>
          ))}
        </div>

      </form>

      {/* Guaranteed Floating Action Bar for easy access on long forms */}
      <div className="fixed bottom-8 right-8 z-[100] flex items-center gap-2 shadow-2xl bg-background border border-border p-2 rounded-2xl md:right-12">
        <button
          type="button"
          onClick={() => {
            if (confirm("Select OK to discard all unsaved changes and reload from the server. Are you sure?")) {
              fetchProfile();
            }
          }}
          disabled={isSaving}
          className="text-muted-foreground hover:bg-muted px-4 py-2 font-medium text-sm transition-colors rounded-xl"
        >
          Discard
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-xl font-medium text-sm disabled:opacity-50 transition-colors flex items-center gap-2 shadow-md"
        >
          {isSaving ? "Saving..." : <><CheckCircle2 className="w-4 h-4" /> Save Changes</>}
        </button>
      </div>
    </div>
  );
}
