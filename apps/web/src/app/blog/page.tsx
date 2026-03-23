import Link from "next/link";
import { getAllPosts } from "@/lib/mdx";
import { BlogFilter } from "@/components/BlogFilter";

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="bg-background min-h-screen py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl lg:mx-0 mb-10">
          <h2 className="text-3xl font-bold tracking-tight text-emerald-400 sm:text-4xl">The Lab</h2>
          <p className="mt-2 text-lg leading-8 text-muted-foreground">
            Learn how to build scalable cloud architectures, optimize CI/CD pipelines, and write concurrent Go applications.
          </p>
        </div>
        
        <BlogFilter posts={posts} />
      </div>
    </div>
  );
}
