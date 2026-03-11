import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Github, Linkedin, Rocket, Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";

interface Experience {
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

interface Education {
  degree: string;
  institution: string;
  start_time: string;
  end_time: string;
  program_type: string;
}

interface ProfileData {
  bio: string;
  avatar_url: string;
  whatsapp_number: string;
  github_url: string;
  linkedin_url: string;
  twitter_url: string;
  experiences: Experience[];
  education: Education[];
  technical_skills: string[];
}

// Ensure the profile handles empty DB responses gracefully
const defaultProfile: ProfileData = {
  bio: "A highly passionate software engineer dedicated to building scalable and robust web applications.",
  avatar_url: "",
  whatsapp_number: "",
  github_url: "#",
  linkedin_url: "#",
  twitter_url: "#",
  experiences: [],
  education: [],
  technical_skills: ["Go", "React", "TypeScript", "PostgreSQL", "Docker"]
};

export async function AboutSection() {
  let profile: ProfileData = defaultProfile;
  
  function formatImageUrl(url: string) {
    if (url && url.includes("drive.google.com/file/d/")) {
      const parts = url.split("/d/");
      if (parts.length > 1) {
        const id = parts[1].split("/")[0];
        return `https://drive.google.com/uc?export=view&id=${id}`;
      }
    }
    return url;
  }
  
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8081/api"}/profile`, {
      next: { revalidate: 10 } // Revalidate every 10 seconds for caching
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id && data.id !== 0) {
        // Only override if the DB actually returned a populated row
        profile = {
          bio: data.bio || defaultProfile.bio,
          avatar_url: data.avatar_url || defaultProfile.avatar_url,
          whatsapp_number: data.whatsapp_number || defaultProfile.whatsapp_number,
          github_url: data.github_url || defaultProfile.github_url,
          linkedin_url: data.linkedin_url || defaultProfile.linkedin_url,
          twitter_url: data.twitter_url || defaultProfile.twitter_url,
          experiences: data.experiences || [],
          education: data.education || [],
          technical_skills: data.technical_skills || []
        };
      }
    }
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    // Fallback to default Profile gracefully on crash
  }

  return (
    <section id="about" className="py-24 sm:py-32 bg-background relative overflow-hidden border-t border-border">
      {/* Background glow matching the Hero section */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#0ea5e9] to-[#10b981] opacity-10 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl relative inline-block">
            The Engineer Behind the Code
            <div className="absolute -bottom-2 left-0 w-1/3 h-1 bg-gradient-to-r from-sky-400 to-emerald-400 rounded-full"></div>
          </h2>
        </div>

        <div className="flex flex-col gap-24 relative z-10">
          
          {/* Top Row: Bio & Tech Stack */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
            {/* Left Column: Bio & Consultant Edge */}
            <div className="flex flex-col gap-10">
              {profile.avatar_url && (
                <div className="relative w-48 h-48 rounded-2xl overflow-hidden border-4 border-background shadow-xl ring-2 ring-emerald-500/30">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src={formatImageUrl(profile.avatar_url)} 
                    alt="Avatar Portrait" 
                    className="object-cover w-full h-full"
                  />
                </div>
              )}

              <div className="prose prose-invert prose-emerald text-muted-foreground">
                {profile.bio.split('\n\n').map((paragraph, idx) => (
                  <p key={idx} className="text-lg leading-relaxed mt-4 first:mt-0">
                    {paragraph}
                  </p>
                ))}
              </div>

              {/* The Consultant Edge */}
              <Card className="bg-sky-100 dark:bg-sky-950/20 border-sky-200 dark:border-sky-500/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-sky-400 to-emerald-400"></div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-foreground dark:text-white mb-2 flex items-center gap-2">
                    <Rocket className="text-sky-600 dark:text-sky-400 w-5 h-5" />
                    Why Me?
                  </h3>
                  <p className="text-muted-foreground italic leading-relaxed">
                    &quot;I don&apos;t just build infrastructure; I optimize for ROI. My goal is to reduce your cloud bill while increasing your deployment frequency.&quot;
                  </p>
                </CardContent>
              </Card>

              {/* Connect / Socials */}
              <div>
                <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-4">Let&apos;s Connect</h3>
                <div className="flex flex-wrap gap-4">
                  {profile.linkedin_url && (
                    <Link href={profile.linkedin_url} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary border border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-all text-sm text-foreground shadow-sm">
                      <Linkedin className="w-4 h-4 text-[#0A66C2] group-hover:text-emerald-500" /> LinkedIn
                    </Link>
                  )}
                  {profile.github_url && (
                    <Link href={profile.github_url} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary border border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-all text-sm text-foreground shadow-sm">
                      <Github className="w-4 h-4 text-foreground dark:text-white group-hover:text-emerald-500" /> GitHub
                    </Link>
                  )}
                  {profile.twitter_url && (
                    <Link href={profile.twitter_url} target="_blank" className="flex items-center gap-2 px-4 py-2 rounded-md bg-secondary border border-border hover:bg-emerald-500/10 hover:border-emerald-500/50 hover:text-emerald-500 transition-all text-sm text-foreground shadow-sm">
                      <svg className="w-4 h-4 text-foreground dark:text-white fill-current group-hover:text-emerald-500" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg> <span className="px-1">X</span>
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column: Tech Stack Cloud */}
            <div className="flex flex-col gap-12">
              {profile.technical_skills && profile.technical_skills.length > 0 && (
                <div className="bg-card/30 backdrop-blur-sm p-8 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 text-emerald-500/5 rotate-12 pointer-events-none group-hover:rotate-45 transition-transform duration-700">
                    <Rocket className="w-48 h-48" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground mb-6 flex items-center gap-2 relative z-10">
                    <Rocket className="w-6 h-6 text-emerald-500" />
                    Technical Arsenal
                  </h3>
                  <div className="flex flex-wrap gap-3 relative z-10">
                    {profile.technical_skills.map((tech, idx) => (
                      <Badge key={idx} variant="secondary" className="px-4 py-2 text-sm bg-background border border-border/50 hover:bg-emerald-500 hover:text-white hover:border-emerald-500 transition-all cursor-default shadow-sm">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Row: Full Width Professional Timeline */}
          <div className="max-w-4xl mx-auto w-full pt-8 border-t border-border/50 relative">
            <h3 className="text-3xl font-bold text-foreground mb-16 flex justify-center items-center gap-3">
              <Briefcase className="w-8 h-8 text-sky-500" />
              Career Timeline
            </h3>
            
            <div className="relative border-l-2 border-emerald-500/20 dark:border-emerald-500/20 ml-4 space-y-16">
              
              {(!profile.experiences || profile.experiences.length === 0) && (!profile.education || profile.education.length === 0) && (
                <p className="text-sm text-muted-foreground ml-4 text-center">No timeline configured yet.</p>
              )}

              {/* Map Experiences */}
              {[...profile.experiences].sort((a, b) => {
                const aEnd = a.is_present ? "9999-99" : (a.end_time || a.start_time || "");
                const bEnd = b.is_present ? "9999-99" : (b.end_time || b.start_time || "");
                if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
                return (b.start_time || "").localeCompare(a.start_time || "");
              }).map((exp, idx) => (
                <div key={`exp-${idx}`} className="relative pl-10 group">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-emerald-500 ring-4 ring-background shadow-sm group-hover:scale-125 group-hover:ring-emerald-500/30 transition-all duration-300"></div>
                  
                  <div className="bg-card/40 border border-border/50 rounded-2xl p-6 hover:shadow-lg transition-all hover:bg-card/60 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-emerald-500/5 transition-colors"></div>
                    
                    <h4 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                      <Briefcase className="w-5 h-5 text-sky-500" /> {exp.role}
                    </h4>
                    <p className="text-emerald-600 dark:text-emerald-400 font-medium mt-2 flex flex-wrap items-center gap-x-2">
                      <span className="text-lg">{exp.company}</span> 
                      <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                        {exp.start_time || "Unknown"} — {exp.is_present ? "Present" : exp.end_time || "Unknown"}
                      </Badge>
                    </p>
                    {exp.location && (
                      <p className="text-muted-foreground text-xs mt-3 uppercase tracking-wider font-semibold bg-secondary inline-block px-3 py-1 rounded-full">
                        {exp.location} • {exp.location_type}
                      </p>
                    )}
                    <p className="text-muted-foreground text-sm mt-4 leading-relaxed relative z-10">
                      {exp.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Map Education */}
              {[...profile.education].sort((a, b) => {
                const aEnd = a.end_time || a.start_time || "";
                const bEnd = b.end_time || b.start_time || "";
                if (aEnd !== bEnd) return bEnd.localeCompare(aEnd);
                return (b.start_time || "").localeCompare(a.start_time || "");
              }).map((edu, idx) => (
                <div key={`edu-${idx}`} className="relative pl-10 group mt-16">
                  <div className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-slate-400 dark:bg-slate-500 ring-4 ring-background shadow-sm group-hover:scale-125 group-hover:ring-slate-400/30 transition-all duration-300"></div>
                  
                  <div className="border border-border/50 rounded-2xl p-6 bg-transparent hover:bg-secondary/50 transition-colors">
                    <h4 className="text-xl font-bold text-foreground dark:text-white flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-slate-500 dark:text-slate-400" /> {edu.institution}
                    </h4>
                    <p className="text-foreground dark:text-white/80 font-medium mt-2 flex flex-wrap items-center gap-x-2">
                      <span>{edu.degree}</span>
                      <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30">
                        {edu.start_time || "Unknown"} — {edu.end_time || "Unknown"}
                      </Badge>
                    </p>
                    <p className="text-muted-foreground text-sm mt-3 font-medium">
                      {edu.program_type}
                    </p>
                  </div>
                </div>
              ))}

            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
