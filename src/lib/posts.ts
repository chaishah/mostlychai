import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const CONTENT_DIR = path.join(process.cwd(), "content/posts");
export const JSX_POSTS_DIR = path.join(process.cwd(), "src/posts");

export type PostType = "post" | "note";
export type ContentType = "markdown" | "jsx";

export interface Heading {
  depth: number;
  text: string;
  id: string;
}

export interface PostMeta {
  slug: string[];
  title: string;
  date: string;
  description: string;
  tags: string[];
  readingTime: number;
  type: PostType;
  contentType: ContentType;
}

export interface Post extends PostMeta {
  content: string; // rendered HTML for markdown, raw source for jsx
  headings: Heading[];
}

interface StoredPostRow {
  slug: string;
  title: string;
  date: string | null;
  description: string | null;
  tags: string[] | null;
  content_md: string;
  content_type: string | null;
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

export function extractJsxCommentMeta(source: string): {
  title: string;
  date: string;
  description: string;
  tags: string[];
  type: PostType;
} {
  const meta: Record<string, string> = {};
  for (const line of source.split("\n")) {
    const match = line.match(/^\/\/\s*(\w+):\s*(.+)$/);
    if (match) {
      meta[match[1].toLowerCase()] = match[2].trim();
    } else if (line.trim() && !line.startsWith("//")) {
      break;
    }
  }
  return {
    title: meta.title ?? "",
    date: meta.date ? String(meta.date).slice(0, 10) : new Date().toISOString().slice(0, 10),
    description: meta.description ?? "",
    tags: meta.tags
      ? meta.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [],
    type: meta.type === "note" ? "note" : "post",
  };
}

function rowToMeta(row: StoredPostRow): PostMeta {
  if (row.content_type === "jsx") {
    return {
      slug: row.slug.split("/"),
      title: row.title,
      date: row.date ?? "",
      description: row.description ?? "",
      tags: Array.isArray(row.tags) ? row.tags : [],
      readingTime: estimateReadingTime(row.content_md),
      type: "post",
      contentType: "jsx",
    };
  }
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
    contentType: "markdown",
  };
}

export function extractHeadings(markdown: string): Heading[] {
  const headings: Heading[] = [];
  for (const line of markdown.split("\n")) {
    const match = line.match(/^(#{2,4})\s+(.+)$/);
    if (match) {
      const depth = match[1].length;
      const text = match[2].replace(/[*_`[\]]/g, "").trim();
      const id = text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");
      headings.push({ depth, id, text });
    }
  }
  return headings;
}

export function getRelatedPosts(currentSlug: string[], allPosts: PostMeta[], limit = 3): PostMeta[] {
  const currentSlugStr = currentSlug.join("/");
  const current = allPosts.find((p) => p.slug.join("/") === currentSlugStr);
  if (!current || current.tags.length === 0) return [];
  return allPosts
    .filter((p) => p.slug.join("/") !== currentSlugStr)
    .map((p) => ({ post: p, score: p.tags.filter((t) => current.tags.includes(t)).length }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ post }) => post);
}

async function renderMarkdown(markdown: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
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

function collectJsxFiles(dir: string): string[][] {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const result: string[][] = [];

  for (const entry of entries) {
    if (entry.isFile() && (entry.name.endsWith(".tsx") || entry.name.endsWith(".jsx"))) {
      const name = entry.name.replace(/\.(tsx|jsx)$/, "");
      result.push([name]);
    }
  }

  return result;
}

function resolveJsxFilePath(slug: string[]): string | null {
  if (slug.length !== 1) return null;
  const base = path.join(JSX_POSTS_DIR, slug[0]);
  for (const ext of [".tsx", ".jsx"]) {
    const p = base + ext;
    if (fs.existsSync(p)) return p;
  }
  return null;
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
  const posts: PostMeta[] = [];

  // Markdown posts from content/posts/
  const mdSlugs = collectMarkdownFiles(CONTENT_DIR);
  for (const slug of mdSlugs) {
    const filePath = resolveFilePath(slug);
    if (!filePath) continue;

    const raw = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(raw);

    if (data.draft === true) continue;

    posts.push({
      slug,
      title: data.title ?? slug[slug.length - 1],
      date: data.date ? String(data.date).split("T")[0] : "",
      description: data.description ?? "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      readingTime: estimateReadingTime(content),
      type: parseType(data),
      contentType: "markdown",
    });
  }

  // JSX posts from src/posts/
  const jsxSlugs = collectJsxFiles(JSX_POSTS_DIR);
  for (const slug of jsxSlugs) {
    const filePath = resolveJsxFilePath(slug);
    if (!filePath) continue;

    const source = fs.readFileSync(filePath, "utf8");
    const meta = extractJsxCommentMeta(source);

    posts.push({
      slug,
      title: meta.title || slug[slug.length - 1],
      date: meta.date,
      description: meta.description,
      tags: meta.tags,
      readingTime: estimateReadingTime(source),
      type: meta.type,
      contentType: "jsx",
    });
  }

  return posts.sort((a, b) => (b.date > a.date ? 1 : -1));
}

async function getPostFromFiles(slug: string[]): Promise<Post | null> {
  // Try JSX first (src/posts/)
  const jsxPath = resolveJsxFilePath(slug);
  if (jsxPath) {
    const source = fs.readFileSync(jsxPath, "utf8");
    const meta = extractJsxCommentMeta(source);
    return {
      slug,
      title: meta.title || slug[slug.length - 1],
      date: meta.date,
      description: meta.description,
      tags: meta.tags,
      readingTime: estimateReadingTime(source),
      content: source,
      headings: [],
      type: meta.type,
      contentType: "jsx",
    };
  }

  // Fall back to markdown (content/posts/)
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
    headings: extractHeadings(content),
    type: parseType(data),
    contentType: "markdown",
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
    .select("slug,title,date,description,tags,content_md,content_type,published")
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

export async function uploadImage(file: File): Promise<string> {
  const admin = getSupabaseAdmin();
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, "-")
    .replace(/-+/g, "-");
  const storagePath = `${Date.now()}-${safeName}`;

  const { data, error } = await admin.storage
    .from("images")
    .upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data: { publicUrl } } = admin.storage
    .from("images")
    .getPublicUrl(data.path);

  return publicUrl;
}

export async function getRawPost(slug: string[]): Promise<{ contentMd: string; title: string } | null> {
  if (!hasSupabaseConfig()) return null;
  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from("posts")
    .select("content_md,content_type,title,date,description,tags")
    .eq("slug", slug.join("/"))
    .maybeSingle();
  if (error || !data) return null;

  // Reconstruct full markdown with frontmatter so the editor shows everything
  const row = data as { content_md: string; title: string; date: string | null; description: string | null; tags: string[] | null };
  const tagList = (row.tags ?? []).map((t) => JSON.stringify(t)).join(", ");
  const reconstructed = [
    "---",
    `title: ${JSON.stringify(row.title)}`,
    `date: ${JSON.stringify(row.date ?? "")}`,
    `description: ${JSON.stringify(row.description ?? "")}`,
    `tags: [${tagList}]`,
    "---",
    "",
    row.content_md,
  ].join("\n");

  return { contentMd: reconstructed, title: row.title };
}

export async function updatePost(slug: string[], source: string): Promise<void> {
  const parsed = parseMarkdownPost(source);
  const admin = getSupabaseAdmin();
  const { error } = await admin
    .from("posts")
    .update({
      content_md: parsed.contentMd,
      title: parsed.title,
      description: parsed.description,
      tags: parsed.tags,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug.join("/"));
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
    return [
      ...collectMarkdownFiles(CONTENT_DIR),
      ...collectJsxFiles(JSX_POSTS_DIR),
    ];
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
    .select("slug,title,date,description,tags,content_md,content_type,published")
    .eq("published", true)
    .order("date", { ascending: false });

  const supabasePosts: PostMeta[] = error || !data
    ? []
    : (data as StoredPostRow[]).map(rowToMeta);

  // Merge in local JSX posts (always file-based)
  const jsxSlugs = collectJsxFiles(JSX_POSTS_DIR);
  const jsxPosts: PostMeta[] = [];
  for (const slug of jsxSlugs) {
    const filePath = resolveJsxFilePath(slug);
    if (!filePath) continue;
    const source = fs.readFileSync(filePath, "utf8");
    const meta = extractJsxCommentMeta(source);
    const slugStr = slug.join("/");
    // Skip if already in supabase posts (shouldn't happen, but guard)
    if (supabasePosts.some((p) => p.slug.join("/") === slugStr)) continue;
    jsxPosts.push({
      slug,
      title: meta.title || slug[slug.length - 1],
      date: meta.date,
      description: meta.description,
      tags: meta.tags,
      readingTime: estimateReadingTime(source),
      type: meta.type,
      contentType: "jsx",
    });
  }

  return [...supabasePosts, ...jsxPosts].sort((a, b) => (b.date > a.date ? 1 : -1));
}

export async function getPost(slug: string[]): Promise<Post | null> {
  if (!hasSupabaseConfig()) {
    return getPostFromFiles(slug);
  }

  // Always check for a local JSX post first (file-based, not in Supabase)
  const jsxPost = await getPostFromFiles(slug);
  if (jsxPost && jsxPost.contentType === "jsx") {
    return jsxPost;
  }

  const admin = getSupabaseAdmin();
  const postSlug = slug.join("/");
  const { data, error } = await admin
    .from("posts")
    .select("slug,title,date,description,tags,content_md,content_type,published")
    .eq("slug", postSlug)
    .eq("published", true)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as StoredPostRow;

  if (row.content_type === "jsx") {
    return {
      ...rowToMeta(row),
      content: row.content_md,
      headings: [],
    };
  }

  return {
    ...rowToMeta(row),
    content: await renderMarkdown(row.content_md),
    headings: extractHeadings(row.content_md),
  };
}

export async function publishJsxPost(
  source: string,
  titleOverride?: string
): Promise<{ slug: string[] }> {
  const admin = getSupabaseAdmin();
  // Strip BOM and normalize line endings before parsing
  const normalized = source.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const meta = extractJsxCommentMeta(normalized);
  const title = (titleOverride || meta.title || "").trim();
  if (!title) throw new Error("A title is required. Fill in the title field or add a // title: comment.");

  const slug = slugify(title);

  const { error } = await admin
    .from("posts")
    .upsert(
      {
        slug,
        title,
        date: meta.date,
        description: meta.description,
        tags: meta.tags,
        content_md: normalized,
        content_type: "jsx",
        published: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "slug" }
    );

  if (error) throw new Error(error.message);
  return { slug: [slug] };
}
