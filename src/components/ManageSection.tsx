"use client";

import { useState } from "react";
import type { PostMeta } from "@/lib/posts";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function ManageSection({ initialPosts }: { initialPosts: PostMeta[] }) {
  const [posts, setPosts] = useState(initialPosts);
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState<Record<string, "loading" | "error">>({});

  if (posts.length === 0) return null;

  async function handleUnpublish(slug: string) {
    if (!secret) return;
    setStatus((s) => ({ ...s, [slug]: "loading" }));

    const res = await fetch("/api/unpublish", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-publish-secret": secret,
      },
      body: JSON.stringify({ slug }),
    });

    if (res.ok) {
      setPosts((p) => p.filter((post) => post.slug.join("/") !== slug));
      setStatus((s) => { const next = { ...s }; delete next[slug]; return next; });
    } else {
      setStatus((s) => ({ ...s, [slug]: "error" }));
    }
  }

  return (
    <section>
      <div className="h-px bg-cream-200 my-12" />
      <p className="text-xs text-ink-faint tracking-widest uppercase font-sans mb-6">
        Published posts
      </p>

      <div className="mb-5">
        <input
          type="password"
          placeholder="Publish secret to unpublish"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans"
        />
      </div>

      <div>
        {posts.map((post) => {
          const slug = post.slug.join("/");
          const st = status[slug];
          return (
            <div
              key={slug}
              className="flex items-center justify-between gap-4 py-3 border-b border-cream-200 last:border-0"
            >
              <div className="min-w-0">
                <span className="font-display text-[0.95rem] text-ink block truncate">
                  {post.title}
                </span>
                <span className="text-[0.68rem] text-ink-faint font-sans tracking-wide">
                  {formatDate(post.date)}
                </span>
              </div>
              <button
                onClick={() => handleUnpublish(slug)}
                disabled={!secret || st === "loading"}
                className={`shrink-0 text-xs font-sans transition-colors duration-200 disabled:opacity-30 ${
                  st === "error"
                    ? "text-red-500"
                    : "text-ink-faint hover:text-red-500"
                }`}
              >
                {st === "loading" ? "removing..." : st === "error" ? "failed - retry" : "unpublish"}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
