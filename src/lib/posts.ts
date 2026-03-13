import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CONTENT_DIR = path.join(process.cwd(), "content/posts");

export type PostType = "post" | "note";

export interface PostMeta {
  slug: string[];
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: number;
  type: PostType;
}

export interface Post extends PostMeta {
  content: string;
}

interface StoredPostRow {
  slug: string;
  title: string;
  date: string | null;
  description: string | null;
  tags: string[] | null;
  content_md: string;
  published: boolean | null;
}

interface ParsedMarkdownPost {
  slug: string[];
  title: string;
  date: string;
  description: string;
  tags: string[];
  contentMd: string;
  type: PostType;
  draft: boolean;
}

export interface PublishPostInput {
  title: string;
  date?: string;
  description?: string;
  tags?: string[];
  slug?: string;
  contentMd: string;
}

let supabaseAdmin: SupabaseClient | null = null;

function estimateReadingTime(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 1;
  const words = trimmed.split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function normalizeDate(value: unknown): string {
  if (!value) return new Date().toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizeSlug(input: unknown, fallbackTitle: string): string[] {
  if (Array.isArray(input)) {
    const parts = input.map((part) => slugify(String(part))).filter(Boolean);
    if (parts.length > 0) return parts;
  }

  if (typeof input === "string") {
    const parts = input
      .split("/")
      .map((part) => slugify(part))
      .filter(Boolean);
    if (parts.length > 0) return parts;
  }

  return [slugify(fallbackTitle) || "untitled"];
}

function parseType(data: Record<string, unknown>): PostType {
  return data.type === "note" ? "note" : "post";
}

function rowToMeta(row: StoredPostRow): PostMeta {
  // Parse type from the stored frontmatter — no schema column needed
  const { data } = matter(row.content_md);
  return {
    slug: row.slug.split("/"),
    title: row.title,
    date: row.date ?? "",
    description: row.description ?? "",
    tags: Array.isArray(row.tags) ? row.tags : [],
    readingTime: estimateReadingTime(row.content_md),
    type: parseType(data),
  };
}

async function renderMarkdown(markdown: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(markdown);

  return processed.toString();
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

function hasSupabaseConfig(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseAdmin(): SupabaseClient {
  if (!hasSupabaseConfig()) {
    throw new Error("Supabase publishing is not configured.");
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return supabaseAdmin;
}

async function getAllPostMetaFromFiles(): Promise<PostMeta[]> {
  const slugs = collectMarkdownFiles(CONTENT_DIR);
  const posts: PostMeta[] = [];

  for (const slug of slugs) {
    const filePath = resolveFilePath(slug);
    if (!filePath) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    // Skip local drafts
    if (data.draft === true) continue;

    posts.push({
      slug,
      title: data.title ?? slug[slug.length - 1],
      date: data.date ? String(data.date).split("T")[0] : "",
      description: data.description ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingTime: estimateReadingTime(content),
      type: parseType(data),
    });
  }

  return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
}

async function getPostFromFiles(slug: string[]): Promise<Post | null> {
  const filePath = resolveFilePath(slug);
  if (!filePath) return null;

  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);

  return {
    slug,
    title: data.title ?? slug[slug.length - 1],
    date: data.date ? String(data.date).split("T")[0] : "",
    description: data.description ?? "",
    tags: Array.isArray(data.tags) ? data.tags : [],
    readingTime: estimateReadingTime(content),
    content: await renderMarkdown(content),
    type: parseType(data),
  };
}

export function isPublishingConfigured(): boolean {
  return hasSupabaseConfig() && Boolean(process.env.PUBLISH_SECRET);
}

export function parseMarkdownPost(source: string): ParsedMarkdownPost {
  const { data, content } = matter(source);
  const type = parseType(data);
  const title = String(data.title ?? "").trim();

  // Title is required for posts but optional for notes
  if (!title && type !== "note") {
    throw new Error("Missing `title` in frontmatter.");
  }

  // Untitled notes get a slug from their date
  const slugFallback = title || `note-${normalizeDate(data.date)}`;
  const slug = normalizeSlug(data.slug, slugFallback);

  return {
    slug,
    title,
    date: normalizeDate(data.date),
    description: String(data.description ?? "").trim(),
    tags: Array.isArray(data.tags)
      ? data.tags.map((tag) => String(tag).trim()).filter(Boolean)
      : [],
    contentMd: content.trim(),
    type,
    draft: data.draft === true,
  };
}

export function buildMarkdownPost(input: PublishPostInput): string {
  const title = input.title.trim();

  if (!title) {
    throw new Error("Title is required.");
  }

  const contentMd = input.contentMd.trim();

  if (!contentMd) {
    throw new Error("Post content cannot be empty.");
  }

  const frontmatterLines = [
    "---",
    `title: ${JSON.stringify(title)}`,
    `date: ${JSON.stringify(normalizeDate(input.date))}`,
    `description: ${JSON.stringify((input.description ?? "").trim())}`,
    `tags: [${(input.tags ?? []).map((tag) => JSON.stringify(tag.trim())).filter(Boolean).join(", ")}]`,
  ];

  const normalizedSlug = normalizeSlug(input.slug ?? "", title).join("/");
  if (normalizedSlug) {
    frontmatterLines.push(`slug: ${JSON.stringify(normalizedSlug)}`);
  }

  frontmatterLines.push("---", "", contentMd);

  return frontmatterLines.join("\n");
}

export async function publishMarkdownPost(source: string): Promise<{ slug: string[]; draft: boolean }> {
  const parsed = parseMarkdownPost(source);
  const admin = getSupabaseAdmin();

  const payload = {
    slug: parsed.slug.join("/"),
    title: parsed.title,
    date: parsed.date,
    description: parsed.description,
    tags: parsed.tags,
    content_md: parsed.contentMd,
    published: !parsed.draft,
    updated_at: new Date().toISOString(),
  };

  const { error } = await admin
    .from("posts")
    .upsert(payload, { onConflict: "slug" });

  if (error) {
    throw new Error(error.message);
  }

  return { slug: parsed.slug, draft: parsed.draft };
}

export async function getAllDrafts(): Promise<PostMeta[]> {
  if (!hasSupabaseConfig()) return [];

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("slug,title,date,description,tags,content_md,published")
    .eq("published", false)
    .order("date", { ascending: false });

  if (error || !data) return [];
  return (data as StoredPostRow[]).map(rowToMeta);
}

export async function publishDraft(slug: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("posts")
    .update({ published: true, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function unpublishPost(slug: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("posts")
    .update({ published: false, updated_at: new Date().toISOString() })
    .eq("slug", slug);
  if (error) throw new Error(error.message);
}

export async function getAllSlugs(): Promise<string[][]> {
  if (!hasSupabaseConfig()) {
    return collectMarkdownFiles(CONTENT_DIR);
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("slug")
    .eq("published", true);

  if (error || !data) {
    return [];
  }

  return data
    .map((row) => String(row.slug ?? "").split("/").filter(Boolean))
    .filter((slug) => slug.length > 0);
}

export async function getAllPostMeta(): Promise<PostMeta[]> {
  if (!hasSupabaseConfig()) {
    return getAllPostMetaFromFiles();
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("slug,title,date,description,tags,content_md,published")
    .eq("published", true)
    .order("date", { ascending: false });

  if (error || !data) {
    return [];
  }

  return (data as StoredPostRow[]).map(rowToMeta);
}

export async function getPost(slug: string[]): Promise<Post | null> {
  if (!hasSupabaseConfig()) {
    return getPostFromFiles(slug);
  }

  const admin = getSupabaseAdmin();
  const postSlug = slug.join("/");
  const { data, error } = await admin
    .from("posts")
    .select("slug,title,date,description,tags,content_md,published")
    .eq("slug", postSlug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as StoredPostRow;

  return {
    ...rowToMeta(row),
    content: await renderMarkdown(row.content_md),
  };
}
