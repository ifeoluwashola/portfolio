import Link from "next/link";
import { getConsultingPosts } from "@/lib/mdx";
import { format, parseISO } from "date-fns";

export function LatestPosts() {
  const posts = getConsultingPosts().slice(0, 3); // Get the 3 most recent consulting posts

  if (!posts.length) return null;

  return (
    <section className="py-24 sm:py-32 bg-[#0f172a] border-t border-slate-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-bold tracking-widest uppercase leading-7 text-[#eab308]">The Lab</h2>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Latest Thoughts and Guides
          </p>
          <p className="mt-6 text-lg leading-8 text-slate-400">
            Deep dives into DevOps Engineering, Cloud Engineering, Platform Engineering, and Site Reliability Engineering.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col items-start justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-[#eab308]/50 shadow-xl transition-all duration-300 group">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={post.date} className="text-slate-500 font-medium">
                  {post.date ? format(parseISO(post.date), 'MMMM d, yyyy') : 'Unknown Date'}
                </time>
                <span className="relative z-10 rounded-full px-3 py-1.5 font-bold tracking-wide transition-colors bg-[#eab308]/10 text-[#eab308]">
                  {post.category}
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-4 text-xl font-bold leading-7 text-white group-hover:text-[#eab308] transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-400">
                  {post.description}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
