import Link from "next/link";
import type { PostMeta } from "@/lib/posts";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function PostCard({ post }: { post: PostMeta }) {
  const href = `/posts/${post.slug.join("/")}`;

  return (
    <article className="py-8 group">
      <Link href={href} className="block">
        <h2 className="text-xl font-semibold text-neutral-900 group-hover:text-neutral-500 transition-colors mb-2">
          {post.title}
        </h2>
        {post.description && (
          <p className="text-neutral-600 mb-3 leading-relaxed line-clamp-2 font-serif">{post.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-neutral-400">
          {post.date && (
            <>
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{post.readingTime} min read</span>
          {post.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
      </Link>
    </article>
  );
}
