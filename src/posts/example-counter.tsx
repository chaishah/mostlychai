// title: Interactive Counter Demo
// date: 2026-03-21
// description: A live React component rendered as a blog post - no markdown needed.
// tags: interactive, demo
"use client";

import { useState } from "react";

export default function ExampleCounter() {
  const [count, setCount] = useState(0);

  return (
    <div className="space-y-8">
      <p className="text-ink-soft font-sans leading-relaxed">
        This is a JSX post - a full React component rendered directly as a blog
        post. You can use hooks, local state, and any UI you like.
      </p>

      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-8 flex flex-col items-center gap-5">
        <p className="text-xs text-ink-faint tracking-widest uppercase font-sans">
          live counter
        </p>
        <span className="font-display italic text-6xl text-ink">{count}</span>
        <div className="flex gap-3">
          <button
            onClick={() => setCount((c) => c - 1)}
            className="rounded-xl border border-cream-200 bg-white px-5 py-2.5 text-sm font-sans text-ink hover:border-spice/50 transition-colors"
          >
            -1
          </button>
          <button
            onClick={() => setCount(0)}
            className="rounded-xl border border-cream-200 bg-white px-5 py-2.5 text-sm font-sans text-ink-faint hover:border-spice/50 transition-colors"
          >
            reset
          </button>
          <button
            onClick={() => setCount((c) => c + 1)}
            className="rounded-xl bg-ink px-5 py-2.5 text-sm font-sans text-cream-100 hover:bg-spice transition-colors"
          >
            +1
          </button>
        </div>
      </div>

      <p className="text-ink-soft font-sans text-sm leading-relaxed">
        JSX posts live in <code className="text-spice text-xs">src/posts/</code>{" "}
        as <code className="text-spice text-xs">.tsx</code> files. Metadata
        (title, date, tags) is declared in comment lines at the top of the file.
        Upload new JSX posts from the{" "}
        <a href="/publish" className="text-spice hover:underline">
          publish page
        </a>
        .
      </p>
    </div>
  );
}
