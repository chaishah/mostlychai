import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getRawPost, isPublishingConfigured } from "@/lib/posts";
import MarkdownEditor from "@/components/MarkdownEditor";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edit",
  robots: { index: false, follow: false },
};

interface Props {
  params: Promise<{ slug: string[] }>;
}

export default async function EditPage({ params }: Props) {
  const { slug } = await params;

  if (!isPublishingConfigured()) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-14 font-sans text-sm text-ink-soft">
        Publishing not configured.
      </div>
    );
  }

  const post = await getRawPost(slug);
  if (!post) notFound();

  return (
    <MarkdownEditor
      slug={slug.join("/")}
      title={post.title}
      initialContent={post.contentMd}
    />
  );
}
