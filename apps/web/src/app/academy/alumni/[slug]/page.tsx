import { notFound } from "next/navigation";
import Image from "next/image";
import { 
  Github, 
  Linkedin, 
  ExternalLink, 
  Terminal, 
  Cpu, 
  Layers, 
  Globe, 
  ChevronRight,
  ShieldCheck,
  Code
} from "lucide-react";
import { getAlumniProfile } from "@/app/academy/actions";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getAlumniProfile(slug);
  if (!profile) return { title: "Graduate Not Found" };
  return {
    title: `${profile.student_name} | Cloud Native Portfolio`,
    description: `Capstone project and technical expertise of ${profile.student_name}, Kybern Academy Graduate.`,
  };
}

export default async function AlumniPortfolioPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getAlumniProfile(slug);

  if (!profile) return notFound();

  // For this phase, we assume the first project is the main capstone
  const capstone = profile.projects?.[0];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-yellow-500/30 font-mono pb-40">
      {/* Premium Hero Header */}
      <section className="relative pt-40 pb-32 border-b border-slate-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(234,179,8,0.1),transparent_50%)]" />
        <div className="absolute -right-20 -top-20 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full" />
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-yellow-500 animate-in fade-in slide-in-from-left-4 duration-700">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Kybern Elite Certified</span>
              </div>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-tight animate-in fade-in slide-in-from-left-6 duration-1000">
                {profile.student_name}
              </h1>
              <div className="flex flex-wrap items-center gap-6 text-slate-400 animate-in fade-in slide-in-from-left-8 duration-1000">
                <div className="flex items-center gap-2">
                   <Cpu className="w-4 h-4 text-yellow-500/50" />
                   <span className="text-xs uppercase tracking-widest font-bold">Cloud Native Engineer</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-slate-800" />
                <div className="flex items-center gap-2">
                   <Layers className="w-4 h-4 text-yellow-500/50" />
                   <span className="text-xs uppercase tracking-widest font-bold">{profile.cohort_name}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 animate-in fade-in zoom-in duration-1000">
              {profile.linkedin_url && (
                <a 
                  href={profile.linkedin_url} 
                  target="_blank" 
                  className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center hover:border-yellow-500 transition-all group shadow-xl"
                >
                  <Linkedin className="w-6 h-6 text-slate-400 group-hover:text-yellow-500 transition-colors" />
                </a>
              )}
              {profile.github_url && (
                <a 
                  href={profile.github_url} 
                  target="_blank" 
                  className="w-14 h-14 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center hover:border-yellow-500 transition-all group shadow-xl"
                >
                  <Github className="w-6 h-6 text-slate-400 group-hover:text-yellow-500 transition-colors" />
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-24">
        {capstone ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-20">
            {/* Left: Project Technical Content */}
            <div className="lg:col-span-12">
               <div className="mb-20">
                  <div className="flex items-center gap-3 text-yellow-500/50 mb-4">
                    <Terminal className="w-5 h-5" />
                    <span className="text-xs font-bold uppercase tracking-[0.3em]">Capstone Case Study_</span>
                  </div>
                  <h2 className="text-4xl md:text-5xl font-bold mb-10 tracking-tight">{capstone.project_title}</h2>
                  
                  {/* Action Buttons Hub */}
                  <div className="flex flex-wrap gap-6 mb-20">
                    {capstone.repo_url && (
                      <a 
                        href={capstone.repo_url} 
                        target="_blank" 
                        className="flex-1 min-w-[240px] bg-slate-100 text-slate-950 px-8 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all shadow-2xl group shadow-slate-100/5"
                      >
                         <Github className="w-5 h-5" /> Inspect Source Code <ChevronRight className="w-4 h-4 opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                      </a>
                    )}
                    {capstone.live_demo_url && (
                      <a 
                        href={capstone.live_demo_url} 
                        target="_blank" 
                        className="flex-1 min-w-[240px] border border-yellow-500 text-yellow-500 px-8 py-5 rounded-2xl font-bold text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-500/5 transition-all shadow-2xl shadow-yellow-500/5 group"
                      >
                         <Globe className="w-5 h-5" /> Launch Live Deployment <ExternalLink className="w-4 h-4 opacity-30 group-hover:opacity-100 transition-all" />
                      </a>
                    )}
                  </div>
               </div>

               {/* Design & Architecture Diagram */}
               <div className="mb-24 relative">
                  <div className="absolute inset-x-0 h-40 bg-gradient-to-t from-slate-950 to-transparent bottom-0 z-10 pointer-events-none" />
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-lg font-bold uppercase tracking-widest flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5 text-yellow-500" /> Infrastructure Architecture
                    </h3>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Asset v1.02_</span>
                  </div>
                  <div className="bg-slate-900 border border-slate-800 rounded-[32px] p-6 md:p-12 shadow-inner group overflow-hidden">
                    <img 
                       src={capstone.architecture_diagram_url} 
                       alt="Infrastructure Diagram" 
                       className="w-full h-auto rounded-xl shadow-2xl group-hover:scale-[1.02] transition-transform duration-700" 
                    />
                  </div>
               </div>

               {/* Technical Deep Dive */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-20">
                  <div className="lg:col-span-2 prose prose-invert prose-slate max-w-none">
                     <div className="flex items-center gap-3 text-slate-600 mb-8 font-bold text-xs uppercase tracking-[0.2em]">
                        <Code className="w-4 h-4" /> Technical Documentation_
                     </div>
                     <div className="text-slate-400 text-lg leading-relaxed space-y-8 whitespace-pre-wrap">
                        {capstone.description}
                     </div>
                  </div>
                  
                  <div className="lg:col-span-1">
                     <div className="sticky top-12 p-8 bg-slate-900/40 border border-slate-800 rounded-3xl backdrop-blur-sm">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Candidate Stats</h4>
                        <div className="space-y-6">
                           <div>
                              <p className="text-[10px] text-slate-600 uppercase font-bold mb-1 tracking-widest">Graduation Date</p>
                              <p className="text-sm font-bold">{new Date(profile.created_at).toLocaleDateString()}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-600 uppercase font-bold mb-1 tracking-widest">Training Intensity</p>
                              <p className="text-sm font-bold text-yellow-500 uppercase">12 Weeks / 48 Labs</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-600 uppercase font-bold mb-1 tracking-widest">Verified Slugs</p>
                              <div className="flex flex-wrap gap-2 mt-3">
                                 {["AWS", "K8s", "Docker", "Terraform", "GH-Actions", "Grafana"].map(skill => (
                                    <span key={skill} className="px-2 py-1 bg-slate-950 border border-slate-800 rounded text-[9px] font-bold text-slate-500 uppercase tracking-tighter">
                                       {skill}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        </div>
                        <div className="mt-8 pt-8 border-t border-slate-800">
                           <a href="mailto:hire@kybern.com" className="block w-full text-center py-3 bg-yellow-500 text-slate-950 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-yellow-400 transition-all">
                              Inquire About Candidate_
                           </a>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-32 text-center">
            <Terminal className="w-12 h-12 text-slate-700 mx-auto mb-6" />
            <p className="text-slate-500 font-bold uppercase tracking-widest">Awaiting Project Deployment Logs_</p>
          </div>
        )}
      </main>
    </div>
  );
}
