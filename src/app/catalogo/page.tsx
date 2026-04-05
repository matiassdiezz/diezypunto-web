import type { Metadata } from "next";
import { Suspense } from "react";
import { SITE_NAME } from "@/lib/seo";
import { CATALOG_COUNT_LABEL } from "@/lib/catalog-count";
import CatalogContent from "./CatalogContent";

export const metadata: Metadata = {
  title: `Catálogo Completo | Merchandising Corporativo | ${SITE_NAME}`,
  description:
    `Explorá ${CATALOG_COUNT_LABEL} productos de merchandising corporativo personalizables. Remeras, bolsos, tecnología, drinkware y más. Pedí online en diezypunto.`,
  alternates: {
    canonical: "/catalogo",
  },
  openGraph: {
    title: `Catálogo Completo | Merchandising Corporativo | ${SITE_NAME}`,
    description:
      `Explorá ${CATALOG_COUNT_LABEL} productos de merchandising corporativo personalizables. Remeras, bolsos, tecnología, drinkware y más.`,
  },
  twitter: {
    card: "summary",
    title: `Catálogo Completo | Merchandising Corporativo | ${SITE_NAME}`,
    description:
      `Explorá ${CATALOG_COUNT_LABEL} productos de merchandising corporativo personalizables.`,
  },
};

export default function CatalogoPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 lg:px-16 pb-20 pt-28">
          <p className="py-20 text-center text-muted">Cargando productos...</p>
        </div>
      }
    >
      <CatalogContent />
    </Suspense>
  );
}
