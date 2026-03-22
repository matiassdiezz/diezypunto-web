"use client";

import Image from "next/image";
import { Star } from "@phosphor-icons/react";
import ScrollReveal from "../shared/ScrollReveal";

const REVIEWS = [
  "/reviews/review-1.webp",
  "/reviews/review-4.webp",
  "/reviews/review-3.webp",
  "/reviews/review-5.webp",
  "/reviews/review-8.webp",
  "/reviews/review-9.webp",
  "/reviews/review-10.webp",
  "/reviews/review-11.webp",
  "/reviews/review-12.webp",
  "/reviews/review-13.webp",
  "/reviews/review-2.webp",
  "/reviews/review-6.webp",
];

export default function GoogleReviews() {
  return (
    <section className="py-16">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <div className="text-center">
            <div className="flex items-center justify-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" className="h-5 w-5 text-amber-400" />
              ))}
            </div>
            <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
              Lo que dicen nuestros clientes
            </h2>
            <p className="mt-1 text-sm text-muted">
              4.9 estrellas en Google · +50 reseñas
            </p>
          </div>
        </ScrollReveal>

        <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {REVIEWS.map((src, i) => (
            <div
              key={i}
              className="w-64 shrink-0 overflow-hidden rounded-xl border border-border bg-white shadow-sm sm:w-72"
            >
              <Image
                src={src}
                alt={`Reseña de Google ${i + 1}`}
                width={288}
                height={200}
                className="h-auto w-full object-contain"
              />
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a
            href="https://reviewthis.biz/shy-wind-6626"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-white px-6 py-3 text-sm font-medium text-foreground transition-all hover:border-accent hover:bg-accent/5 hover:text-accent"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Dejá tu reseña en Google
          </a>
        </div>
      </div>
    </section>
  );
}
