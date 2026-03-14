import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { getPost, getAllPostMeta, getRelatedPosts } from "@/lib/posts";
import TableOfContents from "@/components/TableOfContents";
import RelatedPosts from "@/components/RelatedPosts";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};

  const ogUrl = new URL("https://mostlychai.com/api/og");
  ogUrl.searchParams.set("title", post.title);
  if (post.description) ogUrl.searchParams.set("description", post.description);
  if (post.tags.length) ogUrl.searchParams.set("tags", post.tags.join(","));
  if (post.date) ogUrl.searchParams.set("date", post.date);

  return {
    title: post.title,
    description: post.description || undefined,
    openGraph: {
      title: post.title,
      description: post.description || undefined,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
      images: [{ url: ogUrl.toString(), width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      images: [ogUrl.toString()],
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
  const [post, allPosts] = await Promise.all([getPost(slug), getAllPostMeta()]);
  if (!post) notFound();

  const currentIndex = allPosts.findIndex((p) => p.slug.join("/") === slug.join("/"));
  const prevPost = currentIndex < allPosts.length - 1 ? allPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? allPosts[currentIndex - 1] : null;
  const relatedPosts = getRelatedPosts(slug, allPosts);

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

          {post.type === "note" ? (
            <>
              {post.title && (
                <p className="text-[0.68rem] text-ink-faint font-sans tracking-widest uppercase mb-3">
                  {post.title}
                </p>
              )}
              {post.description && (
                <p className="font-display italic text-2xl leading-relaxed text-ink mb-6">
                  {post.description}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="font-display text-5xl leading-tight mb-5">{post.title}</h1>
              {post.description && (
                <p className="text-xl text-ink-soft leading-relaxed font-display italic mb-6">
                  {post.description}
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap items-center gap-3">
            {post.type !== "note" && (
              <span className="text-xs text-ink-faint font-sans">{post.readingTime} min read</span>
            )}
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

        {post.type !== "note" && <TableOfContents headings={post.headings} />}

        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </article>

      <RelatedPosts posts={relatedPosts} />

      {(prevPost || nextPost) && (
        <nav className="mt-16 pt-8 border-t border-cream-200 flex justify-between gap-8">
          {prevPost ? (
            <Link
              href={`/posts/${prevPost.slug.join("/")}`}
              className="group flex flex-col gap-1 max-w-[45%]"
            >
              <span className="text-xs text-ink-faint tracking-widest uppercase font-sans group-hover:text-spice transition-colors duration-200">
                ← Older
              </span>
              <span className="font-display text-lg leading-snug text-ink group-hover:text-spice transition-colors duration-200">
                {prevPost.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
          {nextPost ? (
            <Link
              href={`/posts/${nextPost.slug.join("/")}`}
              className="group flex flex-col gap-1 items-end text-right max-w-[45%]"
            >
              <span className="text-xs text-ink-faint tracking-widest uppercase font-sans group-hover:text-spice transition-colors duration-200">
                Newer →
              </span>
              <span className="font-display text-lg leading-snug text-ink group-hover:text-spice transition-colors duration-200">
                {nextPost.title}
              </span>
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  );
}
