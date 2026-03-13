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

export default function NoteCard({
  post,
  onTagClick,
}: {
  post: PostMeta;
  onTagClick?: (tag: string) => void;
}) {
  const href = `/posts/${post.slug.join("/")}`;

  return (
    <article className="py-4 border-b border-cream-200 last:border-b-0">
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
            {post.title && (
              <p className="text-[0.65rem] text-ink-faint font-sans tracking-widest uppercase mb-1.5">
                {post.title}
              </p>
            )}
            <p className="font-display italic text-[0.95rem] leading-relaxed text-ink-soft group-hover:text-ink transition-colors duration-200 line-clamp-3">
              {post.description || "—"}
            </p>
          </Link>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-2">
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
          )}
        </div>

      </div>
    </article>
  );
}
