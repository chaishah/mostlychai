"use client";

import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({
  post,
  onTagClick,
}: {
  post: PostMeta;
  onTagClick?: (tag: string) => void;
}) {
  const href = `/posts/${post.slug.join("/")}`;

  return (
    <article className="py-10 border-b border-cream-200 group last:border-b-0">
      <Link href={href} className="block">
        {post.date && (
          <p className="text-xs text-ink-faint tracking-widest uppercase mb-3 font-sans">
            {formatDate(post.date)}
          </p>
        )}
        <h2 className="font-display text-[1.75rem] leading-snug text-ink group-hover:text-spice transition-colors duration-200 mb-3">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-ink-soft leading-relaxed line-clamp-2 mb-4 text-[0.95rem]">
            {post.description}
          </p>
        )}
        <span className="text-xs text-ink-faint font-sans">{post.readingTime} min read</span>
      </Link>
      {post.tags.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3">
          {post.tags.slice(0, 3).map((tag) =>
            onTagClick ? (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                className="text-xs text-spice-muted bg-spice-light px-2 py-0.5 rounded-full font-sans hover:bg-spice hover:text-cream-50 transition-colors duration-200"
              >
                {tag}
              </button>
            ) : (
              <span
                key={tag}
                className="text-xs text-spice-muted bg-spice-light px-2 py-0.5 rounded-full font-sans"
              >
                {tag}
              </span>
            )
          )}
        </div>
      )}
    </article>
  );
}
