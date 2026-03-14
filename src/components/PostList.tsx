"use client";

import { useState, useMemo } from "react";
import Fuse from "fuse.js";
import PostCard from "./PostCard";
import NoteCard from "./NoteCard";
import type { PostMeta } from "@/lib/posts";

export default function PostList({ posts }: { posts: PostMeta[] }) {
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const fuse = useMemo(
    () =>
      new Fuse(posts, {
        keys: ["title", "description", "tags"],
        threshold: 0.35,
        includeScore: true,
      }),
    [posts]
  );

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    if (searching) return fuse.search(query.trim()).map((r) => r.item);
    if (activeTag) return posts.filter((p) => p.tags.includes(activeTag));
    return posts;
  }, [query, activeTag, fuse, posts, searching]);

  const allTags = useMemo(() => Array.from(new Set(posts.flatMap((p) => p.tags))), [posts]);

  function handleTagClick(tag: string) {
    setActiveTag((prev) => (prev === tag ? null : tag));
    setQuery("");
  }

  return (
    <div>
      {/* Search input */}
      <div className="relative mt-3 mb-1">
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value) setActiveTag(null);
          }}
          placeholder="Search posts..."
          className="w-full bg-transparent border-b border-cream-200 py-2.5 pr-6 text-sm text-ink placeholder:text-ink-faint font-sans focus:outline-none focus:border-spice-muted transition-colors duration-200"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink text-xs"
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tag filter strip — hidden while searching */}
      {!searching && allTags.length > 0 && (
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
          {searching
            ? `No results for "${query}".`
            : `No posts tagged "${activeTag}".`}
        </p>
      ) : (
        <div>
          {filtered.map((post) =>
            post.type === "note" ? (
              <NoteCard
                key={post.slug.join("/")}
                post={post}
                onTagClick={handleTagClick}
              />
            ) : (
              <PostCard
                key={post.slug.join("/")}
                post={post}
                onTagClick={handleTagClick}
              />
            )
          )}
        </div>
      )}
    </div>
  );
}
