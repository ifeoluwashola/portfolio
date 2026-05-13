import { getAcademyMaterialFromSlug, getAcademySlugs } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound, redirect } from "next/navigation";
import { format, parseISO } from "date-fns";
import { BlogInteractivity } from "@/components/BlogInteractivity";
import Link from "next/link";
import { BookOpen, Lock } from "lucide-react";
import { checkMaterialAccess } from "@/app/academy/actions";

export default async function AcademyMaterialPage({ params }: { params: Promise<{ slug: string }> }) {
  const access = await checkMaterialAccess();
  
  if (!access.granted) {
    if (access.reason === "unauthenticated") {
      redirect("/academy/login");
    }
    
    // For locked/unauthorized users, render the glass-wall Lock UI
    return (
      <article className="min-h-screen bg-background py-24 sm:py-32 flex items-center justify-center">
        <div className="relative overflow-hidden rounded-2xl bg-slate-900/50 p-8 ring-1 ring-slate-800 backdrop-blur-sm max-w-lg w-full mx-auto text-center border border-red-500/20">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
            <Lock className="h-6 w-6 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">ACCESS DENIED</h2>
          <p className="text-sm text-slate-400 mb-6">
            Module Status Locked. Please ensure your billing is in good standing to access this material.
          </p>
          <Link href="/academy/billing" className="inline-flex justify-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-yellow-400 transition-colors">
            Go to Billing Dashboard
          </Link>
        </div>
      </article>
    );
  }

  const resolvedParams = await params;
  const material = getAcademyMaterialFromSlug(resolvedParams.slug);

  if (!material) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        
        {/* Breadcrumb */}
        <div className="mb-14 flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/academy/materials" className="flex items-center space-x-2 hover:text-yellow-400 transition-colors">
            <BookOpen className="h-4 w-4" />
            <span className="font-medium">Academy Hub</span>
          </Link>
          <span>/</span>
          <span className="text-yellow-400">{material.meta.title}</span>
        </div>

        <header className="mb-14">
          <div className="flex items-center gap-4 mb-4">
            <time dateTime={material.meta.date} className="text-yellow-400 text-sm font-semibold">
              {material.meta.date ? format(parseISO(material.meta.date), 'MMMM d, yyyy') : 'Unknown Date'}
            </time>
            <span className="relative z-10 rounded-full px-3 py-1 font-medium bg-yellow-500/10 text-yellow-400 text-xs text-center border border-yellow-500/20">
              {material.meta.category}
            </span>
          </div>
          
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {material.meta.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {material.meta.description}
          </p>
        </header>

        <div className="prose dark:prose-invert prose-emerald lg:prose-lg max-w-none prose-pre:bg-secondary prose-pre:text-secondary-foreground prose-pre:border-border prose-pre:border">
          <MDXRemote source={material.content} />
        </div>

        <BlogInteractivity slug={resolvedParams.slug} />
      </div>
    </article>
  );
}
