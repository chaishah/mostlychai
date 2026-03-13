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
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4 mb-2">
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => handleTagClick(tag)}
              className={`text-xs px-3 py-1 rounded-full font-sans transition-colors duration-200 ${
                activeTag === tag
                  ? "bg-spice text-cream-50"
                  : "bg-spice-light text-spice-muted hover:bg-spice hover:text-cream-50"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-ink-faint mt-8">No posts tagged &ldquo;{activeTag}&rdquo;.</p>
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
