import { getAllPostMeta } from "@/lib/posts";
import PostList from "@/components/PostList";

export const dynamic = "force-dynamic";

export default async function Home() {
  const posts = await getAllPostMeta();

  return (
    <div className="max-w-2xl mx-auto px-6 py-14">

      {/* About */}
      <section className="mb-14">
        <h1 className="font-display text-5xl leading-tight mb-6 text-ink">
          Hi, I&apos;m Chai.
        </h1>
        <div className="space-y-4 text-ink-soft leading-relaxed text-base">
          <p>
            Each post here is sized for one sitting - long enough to be worth your time, short enough to finish before your chai goes cold.
          </p>
          <p>
            There are no comments and no likes. I am not here for validation. This is purely a brain dump - things I have been thinking about, building, or trying to figure out. I could absolutely be wrong about most of it. That is kind of the whole point.
          </p>
        </div>
        <div className="flex items-center gap-5 mt-7">
          <a
            href="https://instagram.com/mostlychai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ink-faint hover:text-spice transition-colors duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
            </svg>
            @mostlychai
          </a>
          <span className="text-cream-300" aria-hidden="true">·</span>
          <a
            href="https://github.com/chaishah"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-ink-faint hover:text-spice transition-colors duration-200"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
            chaishah
          </a>
        </div>
      </section>

      {/* Posts */}
      <section>
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="text-xs font-sans tracking-widest uppercase text-ink-faint">Posts</h2>
        </div>
        <div className="h-px bg-cream-200 mb-2" />
        {posts.length === 0 ? (
          <p className="text-ink-faint mt-8 text-sm">
            No posts yet. Publish a markdown file from <code>/publish</code> to get started.
          </p>
        ) : (
          <PostList posts={posts} />
        )}
      </section>

    </div>
  );
}
