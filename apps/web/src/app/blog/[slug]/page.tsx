import { getConsultingPostFromSlug, getConsultingSlugs } from "@/lib/mdx";
import { MDXRemote } from "next-mdx-remote/rsc";
import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import type { Metadata } from "next";
import { BlogInteractivity } from "@/components/BlogInteractivity";
import { mdxComponents, mdxOptions } from "@/components/mdx/MdxComponents";

export async function generateStaticParams() {
  const slugs = getConsultingSlugs();
  return slugs.map((slug) => ({ slug: slug.replace(/\.mdx?$/, "") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const post = getConsultingPostFromSlug(resolvedParams.slug);

  if (!post) {
    return {
      title: "Article Not Found",
    };
  }

  const { title, description, date, author, image, category } = post.meta;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.kyberncloud.com";
  const postUrl = `${siteUrl}/blog/${resolvedParams.slug}`;

  // Use article-specific image if specified, otherwise fallback to default blog cover
  const defaultImage = `${siteUrl}/images/blog/dangote-ipo-fintech-infrastructure.jpg`;
  const ogImageUrl = image
    ? (image.startsWith("http") ? image : `${siteUrl}${image.startsWith("/") ? "" : "/"}${image}`)
    : defaultImage;

  return {
    title: title,
    description: description,
    alternates: {
      canonical: postUrl,
    },
    openGraph: {
      type: "article",
      title: title,
      description: description,
      url: postUrl,
      siteName: "Kybern Nexus",
      publishedTime: date,
      authors: author ? [author] : ["Ifeoluwashola Adaralegbe", "Kybern Nexus"],
      section: category || "Infrastructure",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: title,
      description: description,
      images: [ogImageUrl],
      creator: "@kybernnexus",
    },
  };
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
          {post.meta.image && (
            <div className="mt-8 overflow-hidden rounded-2xl border border-border shadow-md">
              <img
                src={post.meta.image}
                alt={post.meta.title}
                className="w-full h-auto object-cover max-h-[520px]"
              />
            </div>
          )}
        </header>

        <div className="prose dark:prose-invert lg:prose-lg max-w-none prose-a:text-kn-accent hover:prose-a:brightness-110 prose-pre:bg-kn-card prose-pre:text-kn-heading prose-pre:border-kn-border prose-pre:border prose-headings:text-kn-heading prose-p:text-kn-body">
          <MDXRemote source={post.content} options={mdxOptions} components={mdxComponents} />
        </div>

        <BlogInteractivity slug={resolvedParams.slug} />
      </div>
    </article>
  );
}
