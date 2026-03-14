import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function RelatedPosts({ posts }: { posts: PostMeta[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 pt-8 border-t border-cream-200">
      <p className="text-xs font-sans tracking-widest uppercase text-ink-faint mb-6">Related</p>
      <div className="space-y-5">
        {posts.map((post) => (
          <article key={post.slug.join("/")} className="grid grid-cols-[3.75rem_1fr] gap-x-6">
            <time className="text-[0.68rem] text-ink-faint font-sans tracking-wide uppercase pt-[3px]">
              {formatDateShort(post.date)}
            </time>
            <div>
              <Link
                href={`/posts/${post.slug.join("/")}`}
                className="font-display text-[1.1rem] leading-snug text-ink hover:text-spice transition-colors duration-200"
              >
                {post.title}
              </Link>
              {post.description && (
                <p className="text-sm text-ink-soft mt-1 leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
