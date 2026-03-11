import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Assuming the root docs/blog path based on monorepo structure
const POSTS_PATH = path.join(process.cwd(), "../../docs/blog");

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
}

export interface Post {
  content: string;
  meta: PostMeta;
}

export const getSlugs = (): string[] => {
  if (!fs.existsSync(POSTS_PATH)) return [];
  const files = fs.readdirSync(POSTS_PATH);
  return files.filter(file => file.endsWith('.mdx') || file.endsWith('.md'));
};

export const getPostFromSlug = (slug: string): Post | null => {
  const mdxPath = path.join(POSTS_PATH, `${slug}.mdx`);
  const mdPath = path.join(POSTS_PATH, `${slug}.md`);
  
  let source = "";
  if (fs.existsSync(mdxPath)) {
    source = fs.readFileSync(mdxPath, "utf-8");
  } else if (fs.existsSync(mdPath)) {
    source = fs.readFileSync(mdPath, "utf-8");
  } else {
    return null;
  }

  const { content, data } = matter(source);
  
  return {
    content,
    meta: {
      slug,
      title: data.title ?? slug,
      date: data.date ?? new Date().toISOString(),
      description: data.description ?? "",
    },
  };
};

export const getAllPosts = (): PostMeta[] => {
  const posts = getSlugs()
    .map((slug) => {
      // Remove extension for the slug
      const pureSlug = slug.replace(/\.mdx?$/, "");
      const post = getPostFromSlug(pureSlug);
      return post?.meta;
    })
    .filter((meta): meta is PostMeta => meta !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
};
