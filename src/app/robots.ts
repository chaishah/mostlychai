import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/publish/",
    },
    sitemap: "https://mostlychai.com/sitemap.xml",
  };
}
