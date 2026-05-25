import { 
  Terminal, 
  ArrowRight, 
  Linkedin, 
  Github, 
  ShieldCheck,
  ChevronRight,
  Code
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAlumniList, getPublicAvatarUrl } from "@/app/academy/actions";
import { AcademyNavbar } from "@/components/academy/AcademyNavbar";

interface AlumniMember {
  id: number;
  student_name: string;
  slug: string;
  cohort_name: string;
  linkedin_url?: string;
  github_url?: string;
  avatar_s3_key?: string;
}

async function AlumniAvatar({ s3Key, name }: { s3Key?: string; name: string }) {
  const url = s3Key ? await getPublicAvatarUrl(s3Key) : null;
  if (url) {
    return (
      <div className="relative w-16 h-16 rounded-2xl border border-border group-hover:border-yellow-500/20 transition-all shadow-inner overflow-hidden">
        <Image 
          src={url} 
          alt={name} 
          fill
          className="object-cover" 
          sizes="64px"
        />
      </div>
    );
  }
  return (
    <div className="w-16 h-16 bg-background border border-border rounded-2xl flex items-center justify-center text-yellow-500 text-2xl font-bold group-hover:border-yellow-500/20 transition-all shadow-inner">
      {name[0]}
    </div>
  );
}

export const metadata = {
  title: "Alumni Hall of Fame | Kybern Academy",
  description: "Meet the elite engineers who have mastered cloud-native infrastructure at Kybern Academy.",
};

export default async function AlumniGridPage() {
  const alumni = await getAlumniList();

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-yellow-500/30 font-mono pb-32">
      <AcademyNavbar />
      {/* Hero Header */}
      <div className="relative border-b border-border bg-card/50 backdrop-blur-xl pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,rgba(234,179,8,0.15),transparent_70%)]" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="flex items-center gap-4 text-yellow-500 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-[0.4em]">Verified Graduates</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-8 max-w-4xl animate-in fade-in slide-in-from-bottom-6 duration-1000">
            Alumni_ <br />
            <span className="text-yellow-500">Hall of Fame</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-lg max-w-2xl leading-relaxed uppercase tracking-wider animate-in fade-in slide-in-from-bottom-8 duration-1000">
            Meet the specialists who completed 16 weeks of intensive infrastructure warfare. These engineers are ready for any production environment.
          </p>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 -mt-10 relative z-20">
        {alumni.length === 0 ? (
          <div className="bg-card/40 border border-border rounded-3xl p-32 text-center">
            <Terminal className="w-12 h-12 text-muted-foreground/40 mx-auto mb-6" />
            <p className="text-muted-foreground font-bold uppercase tracking-widest">Awaiting the first cohort of elites_</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {alumni.map((member: AlumniMember) => (
              <Link 
                key={member.id} 
                href={`/academy/alumni/${member.slug}`}
                className="group relative bg-card/30 border border-border rounded-3xl p-8 hover:border-yellow-500/40 transition-all hover:bg-card/60 overflow-hidden"
              >
                <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-yellow-500/5 blur-[50px] rounded-full group-hover:bg-yellow-500/10 transition-all" />
                
                <div className="flex items-start justify-between mb-8">
                  <AlumniAvatar s3Key={member.avatar_s3_key} name={member.student_name} />
                  <div className="flex gap-3">
                    {member.linkedin_url && <Linkedin className="w-4 h-4 text-muted-foreground/50 hover:text-yellow-500 transition-colors" />}
                    {member.github_url && <Github className="w-4 h-4 text-muted-foreground/50 hover:text-yellow-500 transition-colors" />}
                  </div>
                </div>

                <div className="space-y-1 mb-10">
                  <h3 className="text-2xl font-bold group-hover:text-yellow-500 transition-colors">{member.student_name}</h3>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{member.cohort_name}</p>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                  <div className="flex items-center gap-2 text-muted-foreground text-[10px] font-bold uppercase tracking-widest">
                    <Code className="w-3 h-3" /> View Portfolio
                  </div>
                  <ArrowRight className="w-4 h-4 text-yellow-500 group-hover:translate-x-2 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Recruitment CTA */}
        <div className="mt-32 border-t border-border pt-32 grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">
           <div className="lg:col-span-3">
              <h2 className="text-4xl font-bold tracking-tight mb-6 uppercase">Hiring Engineering <span className="text-yellow-500">Talent?</span></h2>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-xl">
                 Kybern Academy graduates are rigorously vetted through real-world &quot;Break-It&quot; labs and full-stack infrastructure deployments. They are day-one ready for DevOps, Cloud, and platform engineering roles.
              </p>
           </div>
           <div className="lg:col-span-2 flex flex-col gap-4">
              <a href="mailto:hire@kybern.com" className="w-full bg-foreground text-background dark:bg-white dark:text-black text-center py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-yellow-500 hover:text-slate-950 transition-all">
                Request Talent Directory_
              </a>
              <Link href="/academy" className="w-full border border-border text-muted-foreground text-center py-4 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-card transition-all flex items-center justify-center gap-2">
                Learn About Training <ChevronRight className="w-4 h-4" />
              </Link>
           </div>
        </div>
      </main>
    </div>
  );
}
