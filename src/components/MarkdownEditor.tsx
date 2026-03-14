"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface Props {
  slug: string;
  title: string;
  initialContent: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

export default function MarkdownEditor({ slug, title, initialContent }: Props) {
  const [content, setContent] = useState(initialContent);
  const [secret, setSecret] = useState("");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [previewHtml, setPreviewHtml] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = content !== initialContent;

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
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (err) {
      setSaveStatus("error");
      setSaveError(err instanceof Error ? err.message : "Save failed");
    }
  }

  // Tab key inserts spaces instead of leaving the textarea
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
          {dirty && (
            <span className="text-[0.68rem] text-ink-faint font-sans shrink-0">unsaved</span>
          )}
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between px-5 pb-3 gap-4">
          {/* Tabs */}
          <div className="flex gap-1">
            {(["edit", "preview"] as const).map((t) => (
              <button
                key={t}
                onClick={() => switchTab(t)}
                className={`text-xs font-sans px-3 py-1 rounded-full capitalize transition-colors duration-150 ${
                  tab === t
                    ? "bg-ink text-cream-50"
                    : "text-ink-faint hover:text-ink"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Save controls */}
          <div className="flex items-center gap-2.5">
            {saveStatus === "error" && (
              <span className="text-xs text-red-500 font-sans">{saveError}</span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-spice font-sans">Saved</span>
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
              className="text-xs font-sans bg-ink text-cream-50 rounded-lg px-4 py-1.5 hover:bg-spice transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {saveStatus === "saving" ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </header>

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
