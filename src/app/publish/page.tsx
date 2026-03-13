import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getAllDrafts, getAllPostMeta, isPublishingConfigured, parseMarkdownPost, publishMarkdownPost } from "@/lib/posts";
import FileDropZone from "@/components/FileDropZone";
import ManageSection from "@/components/ManageSection";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Publish",
  robots: { index: false, follow: false },
};

async function publishAction(formData: FormData) {
  "use server";

  const secret = String(formData.get("secret") ?? "");

  if (!process.env.PUBLISH_SECRET) {
    redirect("/publish?error=config");
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    redirect("/publish?error=secret");
  }

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

  try {
    const parsed = parseMarkdownPost(source);
    const result = await publishMarkdownPost(source);
    revalidatePath("/");
    revalidatePath(`/posts/${result.slug.join("/")}`);
    const status = result.draft ? "draft" : "success";
    redirect(
      `/publish?${status}=${encodeURIComponent(result.slug.join("/"))}&title=${encodeURIComponent(parsed.title)}`
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unable to publish post.";
    redirect(`/publish?error=${encodeURIComponent(message)}`);
  }
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
  if (error === "empty") return { tone: "error" as const, text: "Upload a .md file or paste markdown before publishing." };
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

        {/* Secondary: paste raw markdown */}
        <div className="flex items-center gap-4">
          <div className="h-px flex-1 bg-cream-200" />
          <span className="text-[0.68rem] text-ink-faint font-sans tracking-widest uppercase shrink-0">
            or paste markdown
          </span>
          <div className="h-px flex-1 bg-cream-200" />
        </div>

        <textarea
          name="markdown"
          rows={12}
          spellCheck={false}
          placeholder={`# Post\n---\ntitle: "My post"\ndate: "2026-03-14"\ndescription: "Short summary"\ntags: ["notes"]\n---\n\nWrite here.\n\n\n# Note\n---\ntitle: "Quick thought"\ndate: "2026-03-14"\ntype: note\ntags: ["notes"]\n---\n\nNote content goes in description for the home page preview.\n\n\n# Draft (not live until published)\n---\ntitle: "Work in progress"\ndate: "2026-03-14"\ndraft: true\n---\n\nWrite here.`}
          className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-5 py-4 text-sm leading-relaxed text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans resize-none"
        />

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
