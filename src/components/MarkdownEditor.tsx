"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";

interface Props {
  slug: string;
  title: string;
  initialContent: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getReferencedImages(markdown: string): Array<{ alt: string; url: string }> {
  const imgs: Array<{ alt: string; url: string }> = [];
  const regex = /!\[([^\]]*)\]\((https?:\/\/[^)]+)\)/g;
  let match;
  while ((match = regex.exec(markdown)) !== null) {
    imgs.push({ alt: match[1], url: match[2] });
  }
  return imgs.filter((img, i, arr) => arr.findIndex((a) => a.url === img.url) === i);
}

export default function MarkdownEditor({ slug, title, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [secret, setSecret] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [imagesOpen, setImagesOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const dirty = content !== initialContent;
  const referencedImages = useMemo(() => getReferencedImages(content), [content]);

  useEffect(() => {
    if (tab === "edit") textareaRef.current?.focus();
  }, [tab]);

  async function loadPreview() {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markdown: content }),
      });
      const { html } = await res.json();
      setPreviewHtml(html);
    } finally {
      setPreviewLoading(false);
    }
  }

  function switchTab(next: "edit" | "preview") {
    setTab(next);
    if (next === "preview") loadPreview();
  }

  async function handleSave() {
    if (!secret) {
      setSaveError("Enter your publish secret.");
      return;
    }
    setSaveStatus("saving");
    setSaveError("");
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, contentMd: content, secret }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 4000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  function insertAtCursor(text: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((c) => c + "\n" + text);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = content.substring(0, start) + text + content.substring(end);
    setContent(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + text.length;
      el.focus();
    });
  }

  function removeImage(url: string) {
    const pattern = new RegExp(`!\\[[^\\]]*\\]\\(${escapeRegex(url)}\\)\\n?`, "g");
    setContent((c) => c.replace(pattern, ""));
  }

  async function handleImageFile(file: File) {
    if (!secret) {
      setUploadError("Enter your publish secret first.");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", {
        method: "POST",
        headers: { "x-publish-secret": secret },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      insertAtCursor(`![${file.name}](${data.url})`);
      setImagesOpen(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = content.substring(0, start) + "  " + content.substring(end);
      setContent(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  const saveButtonClass = [
    "text-xs font-sans rounded-lg px-4 py-1.5 transition-all duration-200 whitespace-nowrap",
    saveStatus === "saved"
      ? "bg-spice text-cream-50 scale-105"
      : saveStatus === "saving"
      ? "bg-ink text-cream-50 opacity-60 cursor-wait"
      : !dirty
      ? "bg-ink text-cream-50 opacity-30 cursor-not-allowed"
      : "bg-ink text-cream-50 hover:bg-spice",
  ].join(" ");

  return (
    <div className="h-screen flex flex-col bg-cream-100 overflow-hidden">

      {/* Top bar */}
      <header className="shrink-0 border-b border-cream-200 bg-cream-100">
        <div className="flex items-center gap-3 px-5 py-3">
          <Link
            href="/publish"
            className="text-xs text-ink-faint hover:text-spice font-sans tracking-widest uppercase transition-colors shrink-0"
          >
            ← Back
          </Link>
          <div className="w-px h-4 bg-cream-200 shrink-0" />
          <span className="font-display italic text-[1rem] text-ink truncate flex-1 min-w-0">
            {title || slug}
          </span>
          {dirty && saveStatus !== "saved" && (
            <span className="text-[0.68rem] text-ink-faint font-sans shrink-0">unsaved</span>
          )}
          {saveStatus === "saved" && (
            <span className="text-[0.68rem] text-spice font-sans shrink-0">saved ✓</span>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-5 pb-3 gap-3 flex-wrap">
          {/* Left: tabs + image button */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["edit", "preview"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`text-xs font-sans px-3 py-1 rounded-full capitalize transition-colors duration-150 ${
                    tab === t ? "bg-ink text-cream-50" : "text-ink-faint hover:text-ink"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="w-px h-4 bg-cream-200" />

            {/* Image upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="text-xs font-sans text-ink-faint hover:text-spice transition-colors duration-150 disabled:opacity-40 flex items-center gap-1"
              title="Upload image and insert at cursor"
            >
              {uploading ? (
                <span className="animate-pulse">uploading...</span>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="9" cy="9" r="2" />
                    <path d="m21 15-5-5L5 21" />
                  </svg>
                  <span>image</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />

            {/* Toggle images panel */}
            {referencedImages.length > 0 && (
              <button
                onClick={() => setImagesOpen((o) => !o)}
                className="text-xs font-sans text-ink-faint hover:text-ink transition-colors duration-150"
              >
                {referencedImages.length} image{referencedImages.length !== 1 ? "s" : ""}
              </button>
            )}
          </div>

          {/* Right: secret + save */}
          <div className="flex items-center gap-2.5">
            {uploadError && (
              <span className="text-xs text-red-500 font-sans">{uploadError}</span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-500 font-sans">{saveError}</span>
            )}
            <input
              type="password"
              placeholder="Secret"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              className="text-xs border border-cream-200 bg-cream-50 rounded-lg px-3 py-1.5 font-sans text-ink placeholder:text-ink-faint outline-none focus:border-spice-muted transition-colors w-28"
            />
            <button
              onClick={handleSave}
              disabled={saveStatus === "saving" || !dirty}
              className={saveButtonClass}
            >
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "✓ Saved" : "Save"}
            </button>
          </div>
        </div>
      </header>

      {/* Images panel */}
      {imagesOpen && referencedImages.length > 0 && (
        <div className="shrink-0 border-b border-cream-200 bg-cream-50 px-5 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[0.68rem] text-ink-faint font-sans tracking-widest uppercase shrink-0">
              Images
            </span>
            {referencedImages.map((img) => (
              <div key={img.url} className="relative group flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.url}
                  alt={img.alt}
                  className="h-10 w-10 object-cover rounded border border-cream-200"
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-[0.65rem] text-ink-faint font-sans max-w-[120px] truncate">
                    {img.alt || "image"}
                  </span>
                  <button
                    onClick={() => removeImage(img.url)}
                    className="text-[0.65rem] text-ink-faint hover:text-red-500 font-sans transition-colors text-left"
                  >
                    remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Editor / Preview */}
      <main className="flex-1 overflow-hidden">
        {tab === "edit" ? (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            spellCheck={false}
            className="w-full h-full resize-none bg-cream-100 text-ink font-mono text-sm leading-relaxed px-6 py-5 outline-none"
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-2xl mx-auto px-6 py-8">
              {previewLoading ? (
                <p className="text-ink-faint text-sm font-sans">Rendering...</p>
              ) : previewHtml ? (
                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <p className="text-ink-faint text-sm font-sans">No content.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
