import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";
import { getAllDrafts, getAllPostMeta, isPublishingConfigured, JSX_POSTS_DIR, parseMarkdownPost, publishMarkdownPost, uploadImage, extractJsxCommentMeta } from "@/lib/posts";
import FileDropZone from "@/components/FileDropZone";
import ImageUploadZone from "@/components/ImageUploadZone";
import ManageSection from "@/components/ManageSection";

function rewriteImagePaths(markdown: string, imageMap: Map<string, string>): string {
  // Handle Obsidian wiki-link style: ![[filename.png]]
  let result = markdown.replace(/!\[\[([^\]]+)\]\]/g, (match, filename) => {
    const basename = filename.split("/").pop() ?? filename;
    const url = imageMap.get(basename);
    return url ? `![${basename}](${url})` : match;
  });

  // Handle standard markdown style: ![alt](filename.png)
  result = result.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
    if (/^https?:\/\//.test(src) || src.startsWith("/")) return match;
    const basename = src.split("/").pop() ?? src;
    const url = imageMap.get(basename);
    return url ? `![${alt}](${url})` : match;
  });

  return result;
}

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publish",
  robots: { index: false, follow: false },
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Saves a JSX/TSX post to src/posts/ and registers it in jsx-registry.ts */
function saveJsxPost(slug: string, source: string): void {
  // Ensure src/posts/ exists
  if (!fs.existsSync(JSX_POSTS_DIR)) {
    fs.mkdirSync(JSX_POSTS_DIR, { recursive: true });
  }

  // Write the post file
  const postPath = path.join(JSX_POSTS_DIR, `${slug}.tsx`);
  fs.writeFileSync(postPath, source, "utf8");

  // Update jsx-registry.ts
  const registryPath = path.join(process.cwd(), "src/lib/jsx-registry.ts");
  let registrySource = fs.readFileSync(registryPath, "utf8");

  const entryLine = `  "${slug}": () => import("@/posts/${slug}"),`;

  // Only add if not already present
  if (!registrySource.includes(`"${slug}"`)) {
    // Insert the new entry before the closing `};` of the registry object
    const closingIndex = registrySource.lastIndexOf("};");
    if (closingIndex !== -1) {
      registrySource =
        registrySource.slice(0, closingIndex) +
        entryLine +
        "\n" +
        registrySource.slice(closingIndex);
    }
    fs.writeFileSync(registryPath, registrySource, "utf8");
  }
}

async function publishAction(formData: FormData) {
  "use server";

  const secret = String(formData.get("secret") ?? "");

  if (!process.env.PUBLISH_SECRET) {
    redirect("/publish?error=config");
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    redirect("/publish?error=secret");
  }

  const contentType = String(formData.get("content_type") ?? "md");
  const file = formData.get("file");
  const markdown = String(formData.get("markdown") ?? "").trim();

  let source = "";

  if (file instanceof File && file.size > 0) {
    source = (await file.text()).trim();
  } else if (markdown) {
    source = markdown;
  }

  if (!source) {
    redirect("/publish?error=empty");
  }

  let redirectTo = "";

  if (contentType === "jsx") {
    // JSX post: save to src/posts/ and update registry
    try {
      const meta = extractJsxCommentMeta(source);
      const titleField = String(formData.get("jsx_title") ?? "").trim();
      const title = meta.title || titleField;
      if (!title) throw new Error("Add a title - either fill in the title field or add a `// title:` comment.");
      if (!meta.title) source = `// title: ${title}\n` + source;
      const slug = slugify(title);
      saveJsxPost(slug, source);
      revalidatePath("/");
      revalidatePath(`/posts/${slug}`);
      redirectTo = `/publish?success=${encodeURIComponent(slug)}&title=${encodeURIComponent(meta.title)}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to save JSX post.";
      redirectTo = `/publish?error=${encodeURIComponent(message)}`;
    }
  } else {
    // Markdown post: upload images, publish to Supabase
    const imageFiles = formData
      .getAll("images")
      .filter((f): f is File => f instanceof File && f.size > 0);

    try {
      if (imageFiles.length > 0) {
        const imageMap = new Map<string, string>();
        for (const img of imageFiles) {
          const url = await uploadImage(img);
          imageMap.set(img.name, url);
        }
        source = rewriteImagePaths(source, imageMap);
      }

      const parsed = parseMarkdownPost(source);
      const result = await publishMarkdownPost(source);
      revalidatePath("/");
      revalidatePath(`/posts/${result.slug.join("/")}`);
      const status = result.draft ? "draft" : "success";
      redirectTo = `/publish?${status}=${encodeURIComponent(result.slug.join("/"))}&title=${encodeURIComponent(parsed.title)}`;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to publish post.";
      redirectTo = `/publish?error=${encodeURIComponent(message)}`;
    }
  }

  redirect(redirectTo);
}

function getAlert(params: Record<string, string | string[] | undefined>) {
  const success = typeof params.success === "string" ? params.success : "";
  const draft = typeof params.draft === "string" ? params.draft : "";
  const title = typeof params.title === "string" ? params.title : "";
  const error = typeof params.error === "string" ? params.error : "";

  if (success) return { tone: "success" as const, text: `Published "${title || success}" at /posts/${success}` };
  if (draft) return { tone: "success" as const, text: `Saved "${title || draft}" as a draft. Publish it from the manage section below.` };
  if (error === "config") return { tone: "error" as const, text: "Add NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and PUBLISH_SECRET to enable publishing." };
  if (error === "secret") return { tone: "error" as const, text: "Incorrect publish secret." };
  if (error === "empty") return { tone: "error" as const, text: "Upload a .md or .jsx file before publishing." };
  if (error) return { tone: "error" as const, text: error };
  return null;
}

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [params, posts, drafts] = await Promise.all([searchParams, getAllPostMeta(), getAllDrafts()]);
  const alert = getAlert(params);
  const configured = isPublishingConfigured();

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-spice transition-colors duration-200 mb-14 tracking-widest uppercase font-sans"
      >
        <span aria-hidden="true">←</span>
        <span>Home</span>
      </Link>

      <div className="mb-10">
        <p className="text-xs text-spice tracking-widest uppercase mb-4 font-sans">publish</p>
        <h1 className="font-display italic text-4xl leading-tight text-ink">New post.</h1>
      </div>

      {alert && (
        <div
          className={`mb-8 rounded-xl border px-4 py-3 text-sm font-sans ${
            alert.tone === "success"
              ? "border-spice/25 bg-spice-light text-spice"
              : "border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {alert.text}
        </div>
      )}

      {!configured && (
        <div className="mb-8 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink-soft font-sans">
          Add <code className="text-spice">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
          <code className="text-spice">SUPABASE_SERVICE_ROLE_KEY</code>, and{" "}
          <code className="text-spice">PUBLISH_SECRET</code> to enable publishing.
        </div>
      )}

      <form action={publishAction} className="space-y-5">
        {/* Primary: file upload */}
        <FileDropZone />

        {/* Images */}
        <ImageUploadZone />

        {/* Secret + submit */}
        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            name="secret"
            type="password"
            required
            placeholder="Publish secret"
            className="flex-1 rounded-xl border border-cream-200 bg-cream-50 px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans"
          />
          <button
            type="submit"
            className="rounded-xl bg-ink px-6 py-3 text-sm font-sans text-cream-100 transition-colors hover:bg-spice whitespace-nowrap"
          >
            Publish post
          </button>
        </div>
      </form>

      {/* Manage published posts */}
      <ManageSection published={posts} drafts={drafts} />

      {/* Shortcut reference */}
      <div className="mt-12 rounded-xl border border-cream-200 bg-cream-50 px-5 py-4 space-y-2">
        <p className="text-[0.68rem] text-ink-faint tracking-widest uppercase font-sans">Apple Shortcuts</p>
        <p className="text-sm text-ink-soft font-sans">
          Publish: <code className="text-spice text-xs">POST https://mostlychai.com/api/publish</code>
          <br />
          Header: <code className="text-spice text-xs">x-publish-secret: your-secret</code>
          <br />
          Body: raw <code className="text-spice text-xs">.md</code> file contents (text/plain)
        </p>
        <p className="text-sm text-ink-soft font-sans">
          Unpublish: <code className="text-spice text-xs">POST https://mostlychai.com/api/unpublish</code>
          <br />
          Body: <code className="text-spice text-xs">{`{"slug":"my-post-slug"}`}</code>
        </p>
      </div>
    </div>
  );
}
