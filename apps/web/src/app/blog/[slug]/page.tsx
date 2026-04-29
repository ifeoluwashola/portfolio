import { getConsultingPostFromSlug, getConsultingSlugs } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { BlogInteractivity } from "@/components/BlogInteractivity";

export async function generateStaticParams() {
  const slugs = getConsultingSlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.mdx?$/, "") }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = getConsultingPostFromSlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-transparent py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <header className="mb-14">
          <time dateTime={post.meta.date} className="text-kn-accent block mb-2 text-sm font-semibold">
            {post.meta.date ? format(parseISO(post.meta.date), 'MMMM d, yyyy') : 'Unknown Date'}
          </time>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-kn-heading mb-4">
            {post.meta.title}
          </h1>
          <p className="text-xl text-kn-muted">
            {post.meta.description}
          </p>
        </header>

        <div className="prose dark:prose-invert lg:prose-lg max-w-none prose-a:text-kn-accent hover:prose-a:brightness-110 prose-pre:bg-kn-card prose-pre:text-kn-heading prose-pre:border-kn-border prose-pre:border prose-headings:text-kn-heading prose-p:text-kn-body">
          <MDXRemote source={post.content} />
        </div>

        <BlogInteractivity slug={resolvedParams.slug} />
      </div>
    </article>
  );
}
