import { getAllPostMeta } from "@/lib/posts";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive",
  description: "All posts by year.",
};

export const dynamic = "force-dynamic";

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default async function ArchivePage() {
  const posts = await getAllPostMeta();

  const byYear = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const year = post.date?.slice(0, 4) ?? "Unknown";
    if (!acc[year]) acc[year] = [];
    acc[year].push(post);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => Number(b) - Number(a));

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-ink-faint hover:text-spice transition-colors duration-200 mb-14 tracking-widest uppercase font-sans"
      >
        <span aria-hidden="true">←</span>
        <span>Home</span>
      </Link>

      <h1 className="font-display italic text-4xl text-ink mb-12">Archive</h1>

      {years.length === 0 ? (
        <p className="text-ink-faint text-sm">No posts yet.</p>
      ) : (
        years.map((year) => (
          <section key={year} className="mb-10">
            <h2 className="text-xs font-sans tracking-widest uppercase text-ink-faint mb-3">
              {year}
            </h2>
            <div>
              {byYear[year].map((post) => (
                <article
                  key={post.slug.join("/")}
                  className="py-3 border-b border-cream-200 last:border-b-0"
                >
                  <div className="grid grid-cols-[3.75rem_1fr] gap-x-6">
                    <time className="text-[0.68rem] text-ink-faint font-sans tracking-wide uppercase pt-[3px]">
                      {formatDateShort(post.date)}
                    </time>
                    <Link
                      href={`/posts/${post.slug.join("/")}`}
                      className="font-display text-[1.1rem] leading-snug text-ink hover:text-spice transition-colors duration-200"
                    >
                      {post.title || "Note"}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
}
