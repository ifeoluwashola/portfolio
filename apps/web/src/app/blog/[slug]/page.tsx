import { getPostFromSlug, getSlugs } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";

export async function generateStaticParams() {
  const slugs = getSlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.mdx?$/, "") }));
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const post = getPostFromSlug(resolvedParams.slug);

  if (!post) {
    notFound();
  }

  return (
    <article className="min-h-screen bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-4xl px-6 lg:px-8">
        <header className="mb-14">
          <time dateTime={post.meta.date} className="text-sky-400 block mb-2 text-sm font-semibold">
            {post.meta.date ? format(parseISO(post.meta.date), 'MMMM d, yyyy') : 'Unknown Date'}
          </time>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground mb-4">
            {post.meta.title}
          </h1>
          <p className="text-xl text-muted-foreground">
            {post.meta.description}
          </p>
        </header>

        <div className="prose dark:prose-invert prose-emerald lg:prose-lg max-w-none prose-pre:bg-secondary prose-pre:border-border prose-pre:border">
          <MDXRemote source={post.content} />
        </div>
      </div>
    </article>
  );
}
