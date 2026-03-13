import { getAllPostMeta } from "@/lib/posts";

const BASE_URL = "https://mostlychai.com";

export async function GET() {
  const posts = await getAllPostMeta();

  const items = posts
    .map((post) => {
      const url = `${BASE_URL}/posts/${post.slug.join("/")}`;
      const pubDate = post.date ? new Date(post.date).toUTCString() : "";
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      ${pubDate ? `<pubDate>${pubDate}</pubDate>` : ""}
      ${post.description ? `<description><![CDATA[${post.description}]]></description>` : ""}
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>mostlychai</title>
    <link>${BASE_URL}</link>
    <description>Chai's personal blog - side projects, ideas, and whatever's been on my mind.</description>
    <language>en-US</language>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
