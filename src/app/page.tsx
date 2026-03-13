import { getAllPostMeta } from "@/lib/posts";
import PostCard from "@/components/PostCard";

export default async function Home() {
  const posts = await getAllPostMeta();

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-14">
        <h1 className="text-3xl font-semibold mb-2">Writing</h1>
        <p className="text-neutral-500">Thoughts on things that matter to me.</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-neutral-400">No posts yet. Drop a <code>.md</code> file in <code>content/posts/</code> to get started.</p>
      ) : (
        <div className="divide-y divide-neutral-100">
          {posts.map((post) => (
            <PostCard key={post.slug.join("/")} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
