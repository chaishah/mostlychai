import { NextRequest, NextResponse } from "next/server";
import { uploadImage } from "@/lib/posts";

export async function POST(request: NextRequest) {
  const secret = request.headers.get("x-publish-secret");
  if (!process.env.PUBLISH_SECRET || secret !== process.env.PUBLISH_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  try {
    const url = await uploadImage(file);
    return NextResponse.json({ url, name: file.name });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
