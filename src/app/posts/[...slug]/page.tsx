import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPost } from "@/lib/posts";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function PostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-spice transition-colors duration-200 mb-14 tracking-widest uppercase font-sans"
      >
        <span aria-hidden="true">←</span>
        <span>Writing</span>
      </Link>

      <article>
        <header className="mb-12">
          {post.date && (
            <p className="text-xs text-ink-faint tracking-widest uppercase mb-5 font-sans">
              {formatDate(post.date)}
            </p>
          )}
          <h1 className="font-display text-5xl leading-tight mb-5">{post.title}</h1>
          {post.description && (
            <p className="text-xl text-ink-soft leading-relaxed font-display italic mb-6">
              {post.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-ink-faint font-sans">{post.readingTime} min read</span>
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs text-spice-muted bg-spice-light px-2.5 py-0.5 rounded-full font-sans"
              >
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>
    </div>
  );
}
