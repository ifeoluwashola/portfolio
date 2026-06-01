import Link from "next/link";
import { ArrowRight, UserCircle2 } from "lucide-react";

export async function EngineerTeaser() {
  let profile = null;
  
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
    const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1` : "https://api.kyberncloud.com/api/v1";
    const res = await fetch(`${apiUrl}/profile`, {
      next: { revalidate: 10 }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.id && data.id !== 0) {
        profile = data;
      }
    }
  } catch (error) {
    console.error("Failed to fetch profile data for teaser:", error);
  }

  // Resolve S3 avatar key to a pre-signed URL if necessary
  if (profile && profile.avatar_url && profile.avatar_url.startsWith("avatars/")) {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL ? `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1` : "https://api.kyberncloud.com/api/v1";
      const s3Res = await fetch(`${apiUrl}/public/avatar-url?key=${encodeURIComponent(profile.avatar_url)}`, {
        next: { revalidate: 300 }
      });
      if (s3Res.ok) {
        const s3Data = await s3Res.json();
        if (s3Data.download_url) {
          profile.avatar_url = s3Data.download_url;
        }
      }
    } catch (e) {
      console.error("Failed to resolve S3 avatar URL", e);
    }
  }

  // Truncate bio to either the first paragraph or 200 chars
  let truncatedBio = "A highly passionate software engineer dedicated to building scalable and robust web applications.";
  if (profile && profile.bio) {
    const firstParagraph = profile.bio.split('\n')[0];
    truncatedBio = firstParagraph.length > 200 ? firstParagraph.substring(0, 200) + "..." : firstParagraph;
  }

  return (
    <section className="py-24 bg-background relative overflow-hidden border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="bg-card border border-border/50 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row gap-10 items-center group hover:border-emerald-500/30 transition-colors">
          {profile?.avatar_url ? (
            <div className="relative w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-background shadow-xl ring-2 ring-emerald-500/30 flex-shrink-0 group-hover:ring-emerald-500/50 transition-all">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={formatImageUrl(profile.avatar_url)} 
                alt="Principal Engineer" 
                className="object-cover w-full h-full"
              />
            </div>
          ) : (
            <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 border-4 border-background ring-2 ring-emerald-500/30 group-hover:ring-emerald-500/50 transition-all">
              <UserCircle2 className="w-20 h-20 text-muted-foreground" />
            </div>
          )}
          
          <div className="flex flex-col gap-6 items-start">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-4">
                The Engineer Behind the Code
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                {truncatedBio}
              </p>
            </div>
            
            <Link 
              href="/consulting/about"
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)]"
            >
              Read Full Profile
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
