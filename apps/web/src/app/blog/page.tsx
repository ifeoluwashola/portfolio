import { getConsultingPosts } from "@/lib/mdx";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";

export default function BlogIndex() {
  const posts = getConsultingPosts();

  return (
    <div className="w-full">

      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden bg-kn-bg border-b border-kn-border">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-kn-accent/5 via-kn-bg to-kn-bg pointer-events-none"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-sm font-bold text-kn-accent tracking-widest uppercase mb-4">KYBERN NEXUS LAB</h1>
          <h2 className="text-5xl md:text-6xl font-extrabold text-kn-heading tracking-tight mb-6">
            Practical writing on <span className="text-kn-accent">cloud infrastructure</span> and <span className="text-kn-accent">DevOps engineering.</span>
          </h2>
          <p className="text-xl text-kn-muted leading-relaxed max-w-2xl mx-auto">
            Learn how to build scalable cloud architectures, optimize CI/CD pipelines, and lower infrastructure costs.
          </p>
        </div>
      </section>

      <div className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

        <div className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="flex flex-col items-start justify-between bg-kn-card p-6 rounded-2xl border border-kn-border hover:border-kn-accent/50 shadow-xl transition-all duration-300 group"
            >
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={post.date} className="text-kn-faded font-medium">
                  {post.date
                    ? format(parseISO(post.date), "MMMM d, yyyy")
                    : "Unknown Date"}
                </time>
                <span className="relative z-10 rounded-full px-3 py-1.5 font-bold tracking-wide transition-colors bg-kn-accent-bg text-kn-accent">
                  {post.category}
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-4 text-xl font-bold leading-7 text-kn-heading group-hover:text-kn-accent transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-kn-muted">
                  {post.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-x-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold leading-6 text-kn-accent flex flex-row items-center gap-2 group/link"
                >
                  Read article{" "}
                  <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
        </div>
      </div>
    </div>
  );
}
