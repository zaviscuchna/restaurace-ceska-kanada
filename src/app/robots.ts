import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/sprava-jidelnicku", "/api/"],
    },
    sitemap: "https://restauraceceskakanada.cz/sitemap.xml",
  };
}
