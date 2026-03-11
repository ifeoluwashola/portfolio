import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";
import { format, parseISO } from "date-fns";

export function LatestPosts() {
  const posts = getAllPosts().slice(0, 3); // Get the 3 most recent posts

  if (!posts.length) return null;

  return (
    <section className="py-24 sm:py-32 bg-background border-t border-border">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-sky-600 dark:text-sky-400">The Lab</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Latest Thoughts and Guides
          </p>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Deep dives into Platform Engineering, Site Reliability, and Go programming.
          </p>
        </div>

        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-x-8 gap-y-12 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {posts.map((post) => (
            <article key={post.slug} className="flex flex-col items-start justify-between bg-card/50 backdrop-blur-sm p-6 rounded-2xl border border-border hover:border-foreground/20 transition-all duration-300">
              <div className="flex items-center gap-x-4 text-xs">
                <time dateTime={post.date} className="text-muted-foreground">
                  {post.date ? format(parseISO(post.date), 'MMMM d, yyyy') : 'Unknown Date'}
                </time>
                <span className="relative z-10 rounded-full bg-emerald-500/10 px-3 py-1.5 font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors">
                  Engineering
                </span>
              </div>
              <div className="group relative">
                <h3 className="mt-3 text-lg font-semibold leading-6 text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  <Link href={`/blog/${post.slug}`}>
                    <span className="absolute inset-0" />
                    {post.title}
                  </Link>
                </h3>
                <p className="mt-5 line-clamp-3 text-sm leading-6 text-muted-foreground">
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
