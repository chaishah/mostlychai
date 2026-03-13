"use client";

import { useState } from "react";
import PostCard from "./PostCard";
import type { PostMeta } from "@/lib/posts";

export default function PostList({ posts }: { posts: PostMeta[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const filtered = activeTag
    ? posts.filter((p) => p.tags.includes(activeTag))
    : posts;

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag));
  }

  return (
    <div>
      {/* Tag filter strip */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 py-3 mb-1">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`text-[0.68rem] px-2.5 py-0.5 rounded-full font-sans tracking-wide transition-colors duration-200 ${
                activeTag === tag
                  ? "bg-spice text-cream-50"
                  : "bg-spice-light text-spice-muted hover:bg-spice hover:text-cream-50"
              }`}
            >
              {tag}
            </button>
          ))}
          {activeTag && (
            <button
              onClick={() => setActiveTag(null)}
              className="text-[0.68rem] text-ink-faint font-sans hover:text-spice transition-colors duration-200 ml-1"
              aria-label="Clear filter"
            >
              clear
            </button>
          )}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-ink-faint text-sm mt-6">
          No posts tagged &ldquo;{activeTag}&rdquo;.
        </p>
      ) : (
        <div>
          {filtered.map((post) => (
            <PostCard
              key={post.slug.join("/")}
              post={post}
              onTagClick={handleTagClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
