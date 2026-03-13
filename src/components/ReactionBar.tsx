"use client";

import { useState } from "react";
import type { ReactionType, ReactionCounts } from "@/lib/reactions";

const REACTIONS: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "heart", emoji: "❤️", label: "Love" },
  { type: "thumbsUp", emoji: "👍", label: "Like" },
  { type: "thumbsDown", emoji: "👎", label: "Dislike" },
];

const STORAGE_KEY = (postKey: string) => `reaction:${postKey}`;

export default function ReactionBar({
  postKey,
  initialCounts,
}: {
  postKey: string;
  initialCounts: ReactionCounts;
}) {
  const [counts, setCounts] = useState(initialCounts);
  const [userReaction, setUserReaction] = useState<ReactionType | null>(() => {
    if (typeof window === "undefined") return null;
    return (localStorage.getItem(STORAGE_KEY(postKey)) as ReactionType | null);
  });

  async function handleClick(type: ReactionType) {
    const isToggleOff = userReaction === type;
    const prevReaction = userReaction;
    const newReaction = isToggleOff ? null : type;

    // Optimistic update
    setCounts((prev) => {
      const next = { ...prev };
      if (prevReaction) next[prevReaction] = Math.max(0, next[prevReaction] - 1);
      if (!isToggleOff) next[type] += 1;
      return next;
    });
    setUserReaction(newReaction);

    if (newReaction) localStorage.setItem(STORAGE_KEY(postKey), newReaction);
    else localStorage.removeItem(STORAGE_KEY(postKey));

    try {
      // Remove the previous reaction if switching
      if (prevReaction && prevReaction !== type) {
        await fetch("/api/reactions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: postKey, type: prevReaction, action: "remove" }),
        });
      }
      await fetch("/api/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: postKey, type, action: isToggleOff ? "remove" : "add" }),
      });
    } catch {
      // ignore — optimistic update stands
    }
  }

  return (
    <div className="flex items-center gap-2">
      {REACTIONS.map(({ type, emoji, label }) => (
        <button
          key={type}
          onClick={() => handleClick(type)}
          aria-label={label}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm transition-all ${
            userReaction === type
              ? "border-neutral-400 bg-neutral-100 text-neutral-900"
              : "border-neutral-200 text-neutral-500 hover:border-neutral-300 hover:text-neutral-800"
          }`}
        >
          <span>{emoji}</span>
          <span className="font-medium tabular-nums">{counts[type]}</span>
        </button>
      ))}
    </div>
  );
}
