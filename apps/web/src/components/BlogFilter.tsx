"use client";

import { useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ArrowRight } from "lucide-react";
import { PostMeta } from "@/lib/mdx";

export function BlogFilter({ posts }: { posts: PostMeta[] }) {
  const [filter, setFilter] = useState("All");

  const categories = ["All", "Architecture & Scale", "Cost Optimization", "Community & Learning"];

  const filteredPosts = posts.filter(post => {
    if (filter === "All") return true;
    if (filter === "Architecture & Scale" && post.category === "Architecture") return true;
    if (filter === "Cost Optimization" && post.category === "Cost Optimization") return true;
    if (filter === "Community & Learning" && post.category === "Community") return true;
    return false;
  });

  return (
    <>
      <div className="flex flex-wrap gap-2 mb-10 border-b border-border pb-6">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === cat
                ? "bg-emerald-500 text-white"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid max-w-2xl grid-cols-1 gap-x-8 gap-y-16 border-t border-white/10 pt-10 lg:mx-0 lg:max-w-none lg:grid-cols-3">
        {filteredPosts.map((post) => (
          <article key={post.slug} className="flex max-w-xl flex-col items-start justify-between">
            <div className="flex items-center gap-x-4 text-xs">
              <time dateTime={post.date} className="text-muted-foreground">
                {post.date ? format(parseISO(post.date), 'MMMM d, yyyy') : 'Unknown Date'}
              </time>
              <span className={`relative z-10 rounded-full px-3 py-1.5 font-medium transition-colors ${
                  post.category === 'Architecture' ? 'bg-sky-500/10 text-sky-400' :
                  post.category === 'Cost Optimization' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-slate-500/10 text-slate-400'
                }`}>
                {post.category}
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
    </>
  );
}
