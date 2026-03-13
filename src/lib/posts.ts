import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkHtml from "remark-html";

const CONTENT_DIR = path.join(process.cwd(), "content/posts");

export interface PostMeta {
  slug: string[];
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: number;
}

export interface Post extends PostMeta {
  content: string;
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function collectMarkdownFiles(dir: string, base: string[] = []): string[][] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: string[][] = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      result.push(...collectMarkdownFiles(path.join(dir, entry.name), [...base, entry.name]));
    } else if (entry.name.endsWith(".md")) {
      const name = entry.name.replace(/\.md$/, "");
      result.push(name === "index" ? [...base] : [...base, name]);
    }
  }

  return result;
}

function resolveFilePath(slug: string[]): string | null {
  const asFile = path.join(CONTENT_DIR, ...slug) + ".md";
  if (fs.existsSync(asFile)) return asFile;

  const asIndex = path.join(CONTENT_DIR, ...slug, "index.md");
  if (fs.existsSync(asIndex)) return asIndex;

  return null;
}

export function getAllSlugs(): string[][] {
  return collectMarkdownFiles(CONTENT_DIR);
}

export async function getAllPostMeta(): Promise<PostMeta[]> {
  const slugs = getAllSlugs();
  const posts: PostMeta[] = [];

  for (const slug of slugs) {
    const filePath = resolveFilePath(slug);
    if (!filePath) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    posts.push({
      slug,
      title: data.title ?? slug[slug.length - 1],
      date: data.date ? String(data.date).split("T")[0] : "",
      description: data.description ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingTime: estimateReadingTime(content),
    });
  }

  return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function getPost(slug: string[]): Promise<Post | null> {
  const filePath = resolveFilePath(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml, { sanitize: false })
    .process(content);

  return {
    slug,
    title: data.title ?? slug[slug.length - 1],
    date: data.date ? String(data.date).split("T")[0] : "",
    description: data.description ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingTime: estimateReadingTime(content),
    content: processed.toString(),
  };
}
