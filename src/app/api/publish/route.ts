import { revalidatePath } from "next/cache";
import { parseMarkdownPost, publishMarkdownPost } from "@/lib/posts";

export async function POST(request: Request) {
  const secret = request.headers.get("x-publish-secret") ?? "";

  if (!process.env.PUBLISH_SECRET) {
    return Response.json({ error: "Publishing not configured." }, { status: 503 });
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const markdown = await request.text();

  if (!markdown.trim()) {
    return Response.json({ error: "Request body is empty." }, { status: 400 });
  }

  try {
    const parsed = parseMarkdownPost(markdown);
    const result = await publishMarkdownPost(markdown);
    revalidatePath("/");
    revalidatePath(`/posts/${result.slug.join("/")}`);
    return Response.json({ slug: result.slug.join("/"), title: parsed.title });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish.";
    return Response.json({ error: message }, { status: 422 });
  }
}
