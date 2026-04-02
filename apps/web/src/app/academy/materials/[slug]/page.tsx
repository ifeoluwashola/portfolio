import { getAcademyMaterialFromSlug, getAcademySlugs } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { BlogInteractivity } from "@/components/BlogInteractivity";
import Link from "next/link";
import { BookOpen } from "lucide-react";

export async function generateStaticParams() {
  const slugs = getAcademySlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.mdx?$/, "") }));
}

export default async function AcademyMaterialPage({ params }: { params: Promise<{ slug: string }> }) {
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
