import { NextRequest, NextResponse } from "next/server";
import { updatePost } from "@/lib/posts";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const { slug, contentMd, secret } = await request.json();

  if (!process.env.PUBLISH_SECRET || secret !== process.env.PUBLISH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!slug || !contentMd) {
    return NextResponse.json({ error: "Missing slug or content" }, { status: 400 });
  }

  try {
    const slugParts: string[] = typeof slug === "string" ? slug.split("/") : slug;
    await updatePost(slugParts, contentMd);
    revalidatePath("/");
    revalidatePath(`/posts/${slugParts.join("/")}`);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
