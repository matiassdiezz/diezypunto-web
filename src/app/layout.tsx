import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "diezypunto | Merchandising Corporativo",
  description:
    "Merchandising corporativo con +1,400 productos. Busca con tus palabras y encontra lo que necesitas en segundos.",
  icons: {
    icon: "/logo-icon.png",
    apple: "/logo-icon.png",
  },
  openGraph: {
    title: "diezypunto | Merchandising Corporativo",
    description:
      "Merchandising corporativo con +1,400 productos. Busca con tus palabras y encontra lo que necesitas en segundos.",
    images: ["/logo-diezypunto.webp"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
