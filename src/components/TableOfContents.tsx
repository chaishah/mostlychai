"use client";

import { useState } from "react";
import type { Heading } from "@/lib/posts";

export default function TableOfContents({ headings }: { headings: Heading[] }) {
  const [open, setOpen] = useState(false);

  if (headings.length < 3) return null;

  return (
    <nav className="mb-10 border border-cream-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-xs font-sans tracking-widest uppercase text-ink-faint hover:text-ink transition-colors duration-200"
        aria-expanded={open}
      >
        <span>Contents</span>
        <span
          aria-hidden="true"
          className={`text-[0.6rem] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open && (
        <ol className="px-4 pb-4 space-y-2 border-t border-cream-200 pt-3">
          {headings.map((h) => (
            <li key={h.id} style={{ paddingLeft: `${(h.depth - 2) * 16}px` }}>
              <a
                href={`#${h.id}`}
                onClick={() => setOpen(false)}
                className="text-sm text-ink-soft hover:text-spice transition-colors duration-150 font-sans leading-snug"
              >
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}
