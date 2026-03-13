"use client";

import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
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
    <article className="py-6 border-b border-cream-200 last:border-b-0">
      <div className="grid grid-cols-[3.75rem_1fr] gap-x-6 sm:grid-cols-[4.75rem_1fr] sm:gap-x-8">

        {/* Date column */}
        <div className="pt-[3px]">
          {post.date && (
            <time
              dateTime={post.date}
              className="text-[0.68rem] text-ink-faint font-sans tracking-wide uppercase leading-snug block"
            >
              {formatDateShort(post.date)}
            </time>
          )}
        </div>

        {/* Content column */}
        <div>
          <Link href={href} className="group block">
            <h2 className="font-display text-[1.25rem] leading-snug text-ink group-hover:text-spice transition-colors duration-200 mb-1.5">
              {post.title}
            </h2>
            {post.description && (
              <p className="text-ink-soft text-[0.875rem] leading-relaxed line-clamp-2 mb-2.5">
                {post.description}
              </p>
            )}
          </Link>

          {/* Meta row */}
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[0.68rem] text-ink-faint font-sans tracking-wide">
              {post.readingTime} min
            </span>
            {post.tags.length > 0 && (
              <span className="text-ink-faint text-[0.68rem] select-none">·</span>
            )}
            {post.tags.slice(0, 3).map((tag) =>
              onTagClick ? (
                <button
                  key={tag}
                  onClick={() => onTagClick(tag)}
                  className="text-[0.68rem] text-spice-muted bg-spice-light px-2 py-px rounded-full font-sans hover:bg-spice hover:text-cream-50 transition-colors duration-200"
                >
                  {tag}
                </button>
              ) : (
                <span
                  key={tag}
                  className="text-[0.68rem] text-spice-muted bg-spice-light px-2 py-px rounded-full font-sans"
                >
                  {tag}
                </span>
              )
            )}
          </div>
        </div>

      </div>
    </article>
  );
}
