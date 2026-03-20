import type { Metadata } from "next";
import { Suspense } from "react";
import { getAllProducts } from "@/lib/engine/local-catalog";
import { SITE_NAME, categoryMetaDescription } from "@/lib/seo";
import CategoryContent from "./CategoryContent";

interface Props {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: rawCategory } = await params;
  const category = decodeURIComponent(rawCategory);
  const { total } = getAllProducts({ category, limit: 0 });
  const description = categoryMetaDescription(category, total);
  const title = `${category} | Catálogo Merchandising | ${SITE_NAME}`;

  return {
    title,
    description,
    alternates: {
      canonical: `/catalogo/${encodeURIComponent(category)}`,
    },
    openGraph: {
      title,
      description,
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default function CategoryPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 lg:px-16 pb-20 pt-28">
          <p className="py-20 text-center text-muted">Cargando productos...</p>
        </div>
      }
    >
      <CategoryContent />
    </Suspense>
  );
}
