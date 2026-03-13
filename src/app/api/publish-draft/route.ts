import { revalidatePath } from "next/cache";
import { publishDraft } from "@/lib/posts";

export async function POST(request: Request) {
  const secret = request.headers.get("x-publish-secret") ?? "";

  if (!process.env.PUBLISH_SECRET) {
    return Response.json({ error: "Publishing not configured." }, { status: 503 });
  }

  if (secret !== process.env.PUBLISH_SECRET) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  let slug: string;
  try {
    const body = await request.json();
    slug = typeof body.slug === "string" ? body.slug.trim() : "";
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!slug) {
    return Response.json({ error: "slug is required." }, { status: 400 });
  }

  try {
    await publishDraft(slug);
    revalidatePath("/");
    revalidatePath(`/posts/${slug}`);
    return Response.json({ slug });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to publish draft.";
    return Response.json({ error: message }, { status: 500 });
  }
}
