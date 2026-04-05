import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import ClientLayout from "./client-layout";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { CATALOG_COUNT_LABEL } from "@/lib/catalog-count";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "diezypunto | Merchandising Corporativo",
  description:
    `Merchandising corporativo con ${CATALOG_COUNT_LABEL} productos. Busca con tus palabras y encontra lo que necesitas en segundos.`,
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "diezypunto | Merchandising Corporativo",
    description:
      `Merchandising corporativo con ${CATALOG_COUNT_LABEL} productos. Busca con tus palabras y encontra lo que necesitas en segundos.`,
    images: ["/logo-diezypunto.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "diezypunto | Merchandising Corporativo",
    description:
      `Merchandising corporativo con ${CATALOG_COUNT_LABEL} productos. Busca con tus palabras y encontra lo que necesitas en segundos.`,
    images: ["/logo-diezypunto.webp"],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "Diezypunto",
      url: siteUrl,
      logo: `${siteUrl}/logo-diezypunto.webp`,
      description:
        `Proveedor B2B de merchandising y regalos corporativos en Argentina. ${CATALOG_COUNT_LABEL} productos personalizables.`,
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "sales",
        availableLanguage: "Spanish",
      },
    },
    {
      "@type": "WebSite",
      name: "Diezypunto",
      url: siteUrl,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${siteUrl}/catalogo?search={search_term}`,
        },
        "query-input": "required name=search_term",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        <ClientLayout>{children}</ClientLayout>
        <Analytics />
      </body>
    </html>
  );
}
