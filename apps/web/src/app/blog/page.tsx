import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="bg-background min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0">
          <h2 className="text-3xl font-bold tracking-tight text-emerald-400 sm:text-4xl">The Lab</h2>
          <p className="mt-2 text-lg leading-8 text-muted-foreground">
            Learn how to build scalable cloud architectures, optimize CI/CD pipelines, and write concurrent Go applications.
          </p>
        </div>
        
        <div className="mx-auto mt-10 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-white/10 pt-10 sm:mt-16 sm:pt-16 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="flex max-w-xl flex-col items-start justify-between">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={post.date} className="text-muted-foreground">
                  {post.date ? format(parseISO(post.date), 'MMMM d, yyyy') : 'Unknown Date'}
                </time>
                <span className="relative z-10 rounded-full bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-400">
                  Engineering
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-foreground group-hover:text-emerald-400 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {post.description}
                </p>
              </div>
              <div className="mt-4 flex items-center gap-x-4">
                <Link href={`/blog/${post.slug}`} className="text-sm font-semibold leading-6 text-sky-400 flex flex-row items-center gap-2 group">
                  Read article <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
