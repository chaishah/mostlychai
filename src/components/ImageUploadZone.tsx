"use client";

import { useRef, useState } from "react";

interface ImagePreview {
  name: string;
  url: string;
}

export default function ImageUploadZone() {
  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const next = files.map((f) => ({
      name: f.name,
      url: URL.createObjectURL(f),
    }));
    setPreviews(next);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    setPreviews([]);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {previews.length > 0 ? (
        <div className="rounded-2xl border border-spice/30 bg-spice-light/30 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.68rem] text-ink-faint font-sans tracking-widest uppercase">
              {previews.length} image{previews.length !== 1 ? "s" : ""} selected
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-[0.68rem] text-spice font-sans hover:text-ink transition-colors"
              >
                change
              </button>
              <button
                type="button"
                onClick={clear}
                className="text-[0.68rem] text-ink-faint font-sans hover:text-red-500 transition-colors"
              >
                remove all
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {previews.map((img) => (
              <div key={img.name} className="relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.name}
                  className="h-16 w-16 object-cover rounded-lg border border-cream-200"
                />
                <span className="absolute bottom-0 left-0 right-0 bg-ink/60 text-cream-50 text-[0.55rem] px-1 py-0.5 rounded-b-lg truncate font-sans">
                  {img.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-2xl border border-dashed border-cream-300 px-5 py-4 text-left hover:border-spice/50 transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-ink-faint shrink-0" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <div>
              <p className="text-sm text-ink-soft font-sans">Add images</p>
              <p className="text-[0.68rem] text-ink-faint font-sans mt-0.5">
                Optional - images referenced in your markdown
              </p>
            </div>
          </div>
        </button>
      )}

      <input
        ref={inputRef}
        name="images"
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={handleChange}
      />
    </div>
  );
}
