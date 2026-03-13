import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { isPublishingConfigured, parseMarkdownPost, publishMarkdownPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publish",
  robots: {
    index: false,
    follow: false,
  },
};

async function publishAction(formData: FormData) {
  "use server";

  const secret = String(formData.get("secret") ?? "");
  const markdown = String(formData.get("markdown") ?? "");
  const file = formData.get("file");

  if (!process.env.PUBLISH_SECRET) {
    redirect("/publish?error=config");
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    redirect("/publish?error=secret");
  }

  let source = markdown.trim();

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
      text: "Paste markdown or upload a .md file before publishing.",
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
        <h1 className="font-display text-5xl leading-tight mb-5">Publish from markdown.</h1>
        <p className="text-ink-soft leading-relaxed text-lg max-w-xl">
          Paste a complete markdown post with frontmatter or upload a <code>.md</code> file from Obsidian. The post is saved to Supabase and appears on the site immediately.
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

        <div>
          <label htmlFor="markdown" className="block text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
            Markdown
          </label>
          <textarea
            id="markdown"
            name="markdown"
            rows={18}
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
