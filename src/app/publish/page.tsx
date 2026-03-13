import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { buildMarkdownPost, isPublishingConfigured, parseMarkdownPost, publishMarkdownPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publish",
  robots: {
    index: false,
    follow: false,
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function publishAction(formData: FormData) {
  "use server";

  const secret = String(formData.get("secret") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  const slug = String(formData.get("slug") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const markdown = String(formData.get("markdown") ?? "").trim();
  const file = formData.get("file");

  if (!process.env.PUBLISH_SECRET) {
    redirect("/publish?error=config");
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    redirect("/publish?error=secret");
  }

  let source = "";

  if (title || content || description || tags.length > 0 || date || slug) {
    try {
      source = buildMarkdownPost({
        title,
        date,
        description,
        tags,
        slug,
        contentMd: content,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to build post.";
      redirect(`/publish?error=${encodeURIComponent(message)}`);
    }
  }

  if (!source && markdown) {
    source = markdown;
  }

  if (!source && file instanceof File && file.size > 0) {
    source = (await file.text()).trim();
  }

  if (!source) {
    redirect("/publish?error=empty");
  }

  let publishedSlug = "";
  let publishedTitle = "";

  try {
    const parsed = parseMarkdownPost(source);
    const result = await publishMarkdownPost(source);
    publishedSlug = result.slug.join("/");
    publishedTitle = parsed.title;
    revalidatePath("/");
    revalidatePath(`/posts/${publishedSlug}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to publish post.";
    redirect(`/publish?error=${encodeURIComponent(message)}`);
  }

  redirect(`/publish?success=${encodeURIComponent(publishedSlug)}&title=${encodeURIComponent(publishedTitle)}`);
}

function getMessage(searchParams: Record<string, string | string[] | undefined>) {
  const success = typeof searchParams.success === "string" ? searchParams.success : "";
  const title = typeof searchParams.title === "string" ? searchParams.title : "";
  const error = typeof searchParams.error === "string" ? searchParams.error : "";

  if (success) {
    return {
      tone: "success" as const,
      text: `Published ${title || success} at /posts/${success}`,
    };
  }

  if (error === "config") {
    return {
      tone: "error" as const,
      text: "Publishing is not configured yet. Add your Supabase env vars and PUBLISH_SECRET first.",
    };
  }

  if (error === "secret") {
    return {
      tone: "error" as const,
      text: "That publish secret is incorrect.",
    };
  }

  if (error === "empty") {
    return {
      tone: "error" as const,
      text: "Add a title and post body, or paste markdown, or upload a .md file before publishing.",
    };
  }

  if (error) {
    return {
      tone: "error" as const,
      text: error,
    };
  }

  return null;
}

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const message = getMessage(params);
  const configured = isPublishingConfigured();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-spice transition-colors duration-200 mb-14 tracking-widest uppercase font-sans"
      >
        <span aria-hidden="true">←</span>
        <span>Home</span>
      </Link>

      <section className="mb-10">
        <p className="text-xs text-spice tracking-widest uppercase mb-5 font-sans">publish</p>
        <h1 className="font-display text-5xl leading-tight mb-5">Publish a post.</h1>
        <p className="text-ink-soft leading-relaxed text-lg max-w-xl">
          Fill in the post details and body, then publish directly to Supabase. If you already have a complete markdown file from Obsidian, you can still paste or upload it below.
        </p>
      </section>

      {message && (
        <div
          className={`mb-8 rounded-2xl border px-5 py-4 text-sm ${message.tone === "success"
            ? "border-spice/25 bg-spice-light text-spice"
            : "border-red-200 bg-red-50 text-red-700"
            }`}
        >
          {message.text}
        </div>
      )}

      {!configured && (
        <div className="mb-8 rounded-2xl border border-cream-200 bg-cream-50 px-5 py-4 text-sm text-ink-soft">
          Add <code>NEXT_PUBLIC_SUPABASE_URL</code>, <code>SUPABASE_SERVICE_ROLE_KEY</code>, and <code>PUBLISH_SECRET</code> to enable publishing.
        </div>
      )}

      <form action={publishAction} className="space-y-6">
        <div>
          <label htmlFor="secret" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
            Publish secret
          </label>
          <input
            id="secret"
            name="secret"
            type="password"
            required
            className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="title" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
              Title
            </label>
            <input
              id="title"
              name="title"
              type="text"
              placeholder="Post title"
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
            />
          </div>

          <div>
            <label htmlFor="date" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              defaultValue={today()}
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            placeholder="Short summary for the post card and metadata"
            className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="tags" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
              Tags
            </label>
            <input
              id="tags"
              name="tags"
              type="text"
              placeholder="notes, project, personal"
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
            />
            <p className="mt-2 text-xs text-ink-faint">Use commas to add multiple tags.</p>
          </div>

          <div>
            <label htmlFor="slug" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
              Custom slug
            </label>
            <input
              id="slug"
              name="slug"
              type="text"
              placeholder="optional/custom-slug"
              className="w-full rounded-2xl border border-cream-200 bg-white px-4 py-3 text-sm text-ink outline-none transition-colors focus:border-spice"
            />
            <p className="mt-2 text-xs text-ink-faint">Leave blank to generate it from the title.</p>
          </div>
        </div>

        <div>
          <label htmlFor="content" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
            Post body
          </label>
          <textarea
            id="content"
            name="content"
            rows={18}
            placeholder={`## Opening\n\nWrite the post in markdown here.\n\n- Lists still work\n- Links still work\n- Headings still work`}
            className="w-full rounded-3xl border border-cream-200 bg-white px-5 py-4 text-sm leading-7 text-ink outline-none transition-colors focus:border-spice"
          />
        </div>

        <div className="rounded-3xl border border-cream-200 bg-cream-50 px-5 py-5">
          <div className="mb-4">
            <p className="text-xs text-ink-faint tracking-widest uppercase font-sans">Markdown fallback</p>
            <p className="mt-2 text-sm text-ink-soft">
              If you already have a full markdown post with frontmatter, paste it here or upload a file instead of using the fields above.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label htmlFor="markdown" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
                Raw markdown
              </label>
              <textarea
                id="markdown"
                name="markdown"
                rows={10}
                placeholder={`---\ntitle: "Post title"\ndate: "2026-03-13"\ndescription: "Short summary"\ntags: ["notes"]\n---\n\nWrite here.`}
                className="w-full rounded-3xl border border-cream-200 bg-white px-5 py-4 text-sm leading-7 text-ink outline-none transition-colors focus:border-spice"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
                Or upload a .md file
              </label>
              <input
                id="file"
                name="file"
                type="file"
                accept=".md,text/markdown,text/plain"
                className="block w-full text-sm text-ink-faint file:mr-4 file:rounded-full file:border-0 file:bg-spice-light file:px-4 file:py-2 file:font-sans file:text-sm file:text-spice"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-cream-100 transition-colors hover:bg-spice"
        >
          Publish post
        </button>
      </form>
    </div>
  );
}
