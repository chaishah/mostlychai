"use client";

import { useRef, useState } from "react";

export default function FileDropZone() {
  const [filename, setFilename] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [fileType, setFileType] = useState<"md" | "jsx">("md");

  const inputRef = useRef<HTMLInputElement>(null);

  const accept = fileType === "jsx"
    ? ".jsx,.tsx,text/javascript,text/typescript"
    : ".md,text/markdown,text/plain";

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (inputRef.current) inputRef.current.files = dt.files;
      setFilename(file.name);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFilename(e.target.files?.[0]?.name ?? null);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setFilename(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function switchType(t: "md" | "jsx") {
    setFileType(t);
    setFilename(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      {/* Type selector */}
      <div className="flex gap-1 p-1 rounded-xl bg-cream-100 border border-cream-200 w-fit">
        <button
          type="button"
          onClick={() => switchType("md")}
          className={`px-4 py-1.5 rounded-lg text-xs font-sans transition-colors duration-150 ${
            fileType === "md"
              ? "bg-white shadow-sm text-ink border border-cream-200"
              : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          .md
        </button>
        <button
          type="button"
          onClick={() => switchType("jsx")}
          className={`px-4 py-1.5 rounded-lg text-xs font-sans transition-colors duration-150 ${
            fileType === "jsx"
              ? "bg-white shadow-sm text-ink border border-cream-200"
              : "text-ink-faint hover:text-ink-soft"
          }`}
        >
          .jsx
        </button>
      </div>

      {/* Hidden field so the server action knows the content type */}
      <input type="hidden" name="content_type" value={fileType} />

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !filename && inputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors duration-200 ${
          dragging
            ? "border-spice bg-spice-light cursor-copy"
            : filename
            ? "border-spice/40 bg-spice-light/40 cursor-default"
            : "border-cream-300 hover:border-spice/50 cursor-pointer"
        }`}
      >
        {filename ? (
          <div className="flex items-center justify-center gap-3">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-spice shrink-0" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span className="text-sm font-sans text-ink truncate max-w-[16rem]">{filename}</span>
            <button
              type="button"
              onClick={clear}
              className="text-ink-faint hover:text-spice transition-colors duration-150 font-sans text-xs ml-1 shrink-0"
              aria-label="Remove file"
            >
              ×
            </button>
          </div>
        ) : (
          <div>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint mx-auto mb-3" aria-hidden="true">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="12" y1="18" x2="12" y2="12" />
              <polyline points="9 15 12 12 15 15" />
            </svg>
            <p className="text-sm text-ink-soft font-sans">
              {dragging
                ? "Drop it"
                : fileType === "jsx"
                ? "Drop a .jsx / .tsx file here"
                : "Drop a .md file here"}
            </p>
            <p className="text-xs text-ink-faint font-sans mt-1">or tap to browse Files</p>
          </div>
        )}

        <input
          ref={inputRef}
          name="file"
          type="file"
          accept={accept}
          className="sr-only"
          onChange={handleChange}
        />
      </div>

      {fileType === "jsx" && (
        <p className="text-xs text-ink-faint font-sans px-1">
          JSX posts are stored in Supabase and rendered live in the browser.
        </p>
      )}

      {/* Paste fallback - label and textarea adapt to current type */}
      <div className="flex items-center gap-4 pt-1">
        <div className="h-px flex-1 bg-cream-200" />
        <span className="text-[0.68rem] text-ink-faint font-sans tracking-widest uppercase shrink-0">
          or paste {fileType === "jsx" ? "jsx" : "markdown"}
        </span>
        <div className="h-px flex-1 bg-cream-200" />
      </div>

      {fileType === "jsx" && (
        <input
          name="jsx_title"
          type="text"
          placeholder="Post title (required)"
          className="w-full rounded-xl border border-cream-200 bg-cream-50 px-5 py-3 text-sm text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans"
        />
      )}

      {fileType === "jsx" ? (
        <textarea
          key="jsx-paste"
          name="markdown"
          rows={12}
          spellCheck={false}
          placeholder={`// title: My Interactive Post\n// date: 2026-03-21\n// description: A short summary\n// tags: interactive, demo\n"use client";\n\nimport { useState } from "react";\n\nexport default function MyPost() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <button onClick={() => setCount(c => c + 1)}>{count}</button>\n    </div>\n  );\n}`}
          className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-5 py-4 text-xs leading-relaxed text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-mono resize-none"
        />
      ) : (
        <textarea
          key="md-paste"
          name="markdown"
          rows={12}
          spellCheck={false}
          placeholder={`# Post\n---\ntitle: "My post"\ndate: "2026-03-21"\ndescription: "Short summary"\ntags: ["notes"]\n---\n\nWrite here.\n\n\n# Note\n---\ntitle: "Quick thought"\ndate: "2026-03-21"\ntype: note\ntags: ["notes"]\n---\n\nNote content goes in description for the home page preview.\n\n\n# Draft (not live until published)\n---\ntitle: "Work in progress"\ndate: "2026-03-21"\ndraft: true\n---\n\nWrite here.`}
          className="w-full rounded-2xl border border-cream-200 bg-cream-50 px-5 py-4 text-sm leading-relaxed text-ink placeholder:text-ink-faint outline-none transition-colors focus:border-spice font-sans resize-none"
        />
      )}
    </div>
  );
}
