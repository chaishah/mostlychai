import { NextRequest, NextResponse } from "next/server";
import { getReactions, incrementReaction, type ReactionType } from "@/lib/reactions";

const VALID_TYPES: ReactionType[] = ["heart", "thumbsUp", "thumbsDown"];

export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "Missing slug" }, { status: 400 });

  const counts = await getReactions(slug);
  return NextResponse.json(counts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { slug, type, action } = body;

  if (!slug || !VALID_TYPES.includes(type) || (action !== "add" && action !== "remove")) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const counts = await incrementReaction(slug, type as ReactionType, action === "add" ? 1 : -1);
  return NextResponse.json(counts);
}
