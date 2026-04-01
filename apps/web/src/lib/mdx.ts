import fs from "fs";
import path from "path";
import matter from "gray-matter";

// Constants for the new directory structure
const BLOG_PATH = path.join(process.cwd(), "../../docs/content/blog");
const ACADEMY_PATH = path.join(process.cwd(), "../../docs/content/academy");

export interface PostMeta {
  title: string;
  date: string;
  description: string;
  slug: string;
  category: string;
}

export interface Post {
  content: string;
  meta: PostMeta;
}

// Utility to fetch slugs from any directory
const getSlugsFromDir = (dirPath: string): string[] => {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  return files.filter((file) => file.endsWith(".mdx") || file.endsWith(".md"));
};

// Utility to fetch a generic post by slug and directory
const getGenericPostFromSlug = (dirPath: string, slug: string): Post | null => {
  const mdxPath = path.join(dirPath, `${slug}.mdx`);
  const mdPath = path.join(dirPath, `${slug}.md`);

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
      category: data.category ?? "General",
    },
  };
};

// --- CONSULTING (BLOG) FUNNEL ---
export const getConsultingSlugs = (): string[] => getSlugsFromDir(BLOG_PATH);

export const getConsultingPostFromSlug = (slug: string): Post | null => {
  return getGenericPostFromSlug(BLOG_PATH, slug);
};

export const getConsultingPosts = (): PostMeta[] => {
  const posts = getConsultingSlugs()
    .map((slug) => {
      const pureSlug = slug.replace(/\.mdx?$/, "");
      const post = getConsultingPostFromSlug(pureSlug);
      return post?.meta;
    })
    .filter((meta): meta is PostMeta => meta !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
};

// --- ACADEMY FUNNEL ---
export const getAcademySlugs = (): string[] => getSlugsFromDir(ACADEMY_PATH);

export const getAcademyMaterialFromSlug = (slug: string): Post | null => {
  return getGenericPostFromSlug(ACADEMY_PATH, slug);
};

export const getAcademyMaterials = (): PostMeta[] => {
  const posts = getAcademySlugs()
    .map((slug) => {
      const pureSlug = slug.replace(/\.mdx?$/, "");
      const post = getAcademyMaterialFromSlug(pureSlug);
      return post?.meta;
    })
    .filter((meta): meta is PostMeta => meta !== undefined)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return posts;
};
