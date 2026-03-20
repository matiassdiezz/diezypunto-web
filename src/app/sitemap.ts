import type { MetadataRoute } from "next";
import catalogData from "@/data/catalog.json";
import { getSiteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const BASE_URL = getSiteUrl();
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalogo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/llms.txt`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // Category pages
  const categories = new Set(catalogData.products.map((p) => p.category));
  const categoryPages: MetadataRoute.Sitemap = [...categories].map((cat) => ({
    url: `${BASE_URL}/catalogo/${encodeURIComponent(cat)}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Product pages
  const productPages: MetadataRoute.Sitemap = catalogData.products.map((p) => ({
    url: `${BASE_URL}/producto/${p.product_id}`,
    lastModified: new Date(catalogData.synced_at),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...categoryPages, ...productPages];
}
