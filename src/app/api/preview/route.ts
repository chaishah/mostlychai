import { NextRequest, NextResponse } from "next/server";
import matter from "gray-matter";
import { remark } from "remark";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";

export async function POST(request: NextRequest) {
  const { markdown } = await request.json();
  if (!markdown) return NextResponse.json({ html: "" });

  // Strip frontmatter before rendering
  const { content } = matter(markdown);

  const processed = await remark()
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeHighlight, { detect: true })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return NextResponse.json({ html: processed.toString() });
}
