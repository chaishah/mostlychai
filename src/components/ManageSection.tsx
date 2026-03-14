"use client";

import { useState } from "react";
import Link from "next/link";
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

type ItemStatus = "loading" | "error" | undefined;

function PostRow({
  post,
  secret,
  action,
  actionLabel,
  destructive,
}: {
  post: PostMeta;
  secret: string;
  action: (slug: string, secret: string) => Promise<boolean>;
  actionLabel: string;
  destructive?: boolean;
}) {
  const [status, setStatus] = useState<ItemStatus>();
  const [done, setDone] = useState(false);
  const slug = post.slug.join("/");

  if (done) return null;

  async function handleClick() {
    if (!secret || status === "loading") return;
    setStatus("loading");
    const ok = await action(slug, secret);
    if (ok) setDone(true);
    else setStatus("error");
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-cream-200 last:border-0">
      <div className="min-w-0 flex-1">
        <span className="font-display text-[0.95rem] text-ink block truncate">
          {post.title || <span className="italic text-ink-faint">untitled note</span>}
        </span>
        <span className="text-[0.68rem] text-ink-faint font-sans tracking-wide">
          {formatDate(post.date)}
          {post.type === "note" && (
            <span className="ml-2 text-spice-muted">note</span>
          )}
        </span>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        <Link
          href={`/edit/${slug}`}
          className="text-xs font-sans text-ink-faint hover:text-spice transition-colors duration-200"
        >
          edit
        </Link>
        <button
          onClick={handleClick}
          disabled={!secret || status === "loading"}
          className={`text-xs font-sans transition-colors duration-200 disabled:opacity-30 ${
            status === "error"
              ? "text-red-500"
              : destructive
              ? "text-ink-faint hover:text-red-500"
              : "text-spice hover:text-ink"
          }`}
        >
          {status === "loading" ? "..." : status === "error" ? "failed - retry" : actionLabel}
        </button>
      </div>
    </div>
  );
}

async function callApi(endpoint: string, slug: string, secret: string): Promise<boolean> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-publish-secret": secret,
    },
    body: JSON.stringify({ slug }),
  });
  return res.ok;
}

export default function ManageSection({
  published,
  drafts,
}: {
  published: PostMeta[];
  drafts: PostMeta[];
}) {
  const [secret, setSecret] = useState("");

  if (published.length === 0 && drafts.length === 0) return null;

  return (
    <section>
      <div className="h-px bg-cream-200 my-12" />

      <div className="mb-6">
        <input
          type="password"
          placeholder="Publish secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="w-full rounded-xl border border-cream-200 bg-cream-50 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans"
        />
        <p className="text-[0.68rem] text-ink-faint font-sans mt-2">
          Required to publish drafts or unpublish posts.
        </p>
      </div>

      {/* Drafts */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <p className="text-[0.68rem] text-ink-faint tracking-widest uppercase font-sans mb-3">
            Drafts
          </p>
          <div>
            {drafts.map((post) => (
              <PostRow
                key={post.slug.join("/")}
                post={post}
                secret={secret}
                actionLabel="publish"
                action={(slug, s) => callApi("/api/publish-draft", slug, s)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Published */}
      {published.length > 0 && (
        <div>
          <p className="text-[0.68rem] text-ink-faint tracking-widest uppercase font-sans mb-3">
            Published
          </p>
          <div>
            {published.map((post) => (
              <PostRow
                key={post.slug.join("/")}
                post={post}
                secret={secret}
                actionLabel="unpublish"
                destructive
                action={(slug, s) => callApi("/api/unpublish", slug, s)}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
