import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocalProduct } from "@/lib/engine/local-catalog";
import { getSiteUrl, SITE_NAME, productMetaDescription } from "@/lib/seo";
import ProductDetail from "./ProductDetail";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = getLocalProduct(id);
  if (!product) return {};

  const siteUrl = getSiteUrl();
  const description = productMetaDescription(product);
  const title = `${product.title} | Merchandising Corporativo | ${SITE_NAME}`;
  const image = product.image_urls[0] || undefined;

  return {
    title,
    description,
    alternates: {
      canonical: `/producto/${id}`,
    },
    openGraph: {
      title,
      description,
      images: image ? [image] : undefined,
      url: `${siteUrl}/producto/${id}`,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ProductoPage({ params }: Props) {
  const { id } = await params;
  const product = getLocalProduct(id);

  if (!product) {
    notFound();
  }

  const siteUrl = getSiteUrl();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description:
      product.description ||
      `${product.title} — merchandising corporativo personalizable.`,
    image: product.image_urls[0] || undefined,
    category: product.category,
    sku: product.external_id,
    url: `${siteUrl}/producto/${product.product_id}`,
    brand: { "@type": "Brand", name: "Diezypunto" },
    material:
      product.materials.length > 0
        ? product.materials.join(", ")
        : undefined,
    color:
      product.colors.length > 0 ? product.colors.join(", ") : undefined,
    offers: {
      "@type": "Offer",
      priceCurrency: "ARS",
      ...(product.price != null
        ? { price: product.price.toFixed(2) }
        : {}),
      availability: "https://schema.org/InStock",
      seller: { "@type": "Organization", name: "Diezypunto" },
    },
    additionalProperty:
      product.personalization_methods.length > 0
        ? product.personalization_methods.map((m) => ({
            "@type": "PropertyValue",
            name: "Personalización",
            value: m,
          }))
        : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <Suspense>
        <ProductDetail product={product} />
      </Suspense>
    </>
  );
}
