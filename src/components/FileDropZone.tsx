"use client";

import { useRef, useState } from "react";

export default function FileDropZone() {
  const [filename, setFilename] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

  return (
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
            {dragging ? "Drop it" : "Drop a .md file here"}
          </p>
          <p className="text-xs text-ink-faint font-sans mt-1">or tap to browse Files</p>
        </div>
      )}

      <input
        ref={inputRef}
        name="file"
        type="file"
        accept=".md,text/markdown,text/plain"
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
