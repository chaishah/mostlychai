import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getPost, getAllSlugs } from "@/lib/posts";
import { getReactions } from "@/lib/reactions";
import ReactionBar from "@/components/ReactionBar";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
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

  const postKey = slug.join("/");
  const initialCounts = await getReactions(postKey);

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <article>
        <header className="mb-10">
          <h1 className="text-4xl font-semibold leading-tight mb-4">{post.title}</h1>
          {post.description && (
            <p className="text-xl text-neutral-500 mb-6 leading-relaxed font-serif">{post.description}</p>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-neutral-400">
            {post.date && <time dateTime={post.date}>{formatDate(post.date)}</time>}
            <span>{post.readingTime} min read</span>
            {post.tags.map((tag) => (
              <span key={tag} className="bg-neutral-100 text-neutral-500 px-2.5 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        </header>

        <div
          className="prose prose-neutral max-w-none font-serif prose-headings:font-sans prose-headings:font-semibold prose-lg prose-a:no-underline prose-a:border-b prose-a:border-neutral-400 hover:prose-a:border-neutral-800"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <hr className="my-12 border-neutral-200" />

        <div>
          <p className="text-sm text-neutral-400 mb-3">Did this resonate?</p>
          <ReactionBar postKey={postKey} initialCounts={initialCounts} />
        </div>
      </article>
    </div>
  );
}
