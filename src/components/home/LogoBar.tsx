"use client";

import Image from "next/image";
import ScrollReveal from "../shared/ScrollReveal";

const ROW_1 = [
  { src: "/logos/Disney.webp", alt: "Disney" },
  { src: "/logos/toyota.webp", alt: "Toyota" },
  { src: "/logos/sony.webp", alt: "Sony" },
  { src: "/logos/Nestle.webp", alt: "Nestlé" },
  { src: "/logos/globant.webp", alt: "Globant" },
  { src: "/logos/ypf.webp", alt: "YPF" },
  { src: "/logos/espn.webp", alt: "ESPN" },
  { src: "/logos/loreal.webp", alt: "L'Oréal" },
  { src: "/logos/quilmes.webp", alt: "Quilmes" },
  { src: "/logos/amex.webp", alt: "American Express" },
  { src: "/logos/Honda.webp", alt: "Honda" },
  { src: "/logos/afa.webp", alt: "AFA" },
];

const ROW_2 = [
  { src: "/logos/carrefour.webp", alt: "Carrefour" },
  { src: "/logos/lexus.webp", alt: "Lexus" },
  { src: "/logos/pedidos-ya.webp", alt: "PedidosYa" },
  { src: "/logos/osde.webp", alt: "OSDE" },
  { src: "/logos/western-union.webp", alt: "Western Union" },
  { src: "/logos/axion.webp", alt: "Axion" },
  { src: "/logos/stanley.webp", alt: "Stanley" },
  { src: "/logos/mc-cain.webp", alt: "McCain" },
  { src: "/logos/remax.webp", alt: "RE/MAX" },
  { src: "/logos/cinemark.webp", alt: "Cinemark" },
  { src: "/logos/la-serenisima.webp", alt: "La Serenísima" },
  { src: "/logos/fiserv.webp", alt: "Fiserv" },
];

function MarqueeRow({
  logos,
  reverse = false,
}: {
  logos: typeof ROW_1;
  reverse?: boolean;
}) {
  // Duplicate logos for seamless loop
  const items = [...logos, ...logos];

  return (
    <div className="logo-marquee-mask relative overflow-hidden">
      <div
        className={`flex w-max items-center gap-14 ${
          reverse ? "logo-marquee-reverse" : "logo-marquee"
        }`}
      >
        {items.map((logo, i) => (
          <div
            key={`${logo.alt}-${i}`}
            className="flex h-32 w-72 shrink-0 items-center justify-center"
          >
            <Image
              src={logo.src}
              alt={logo.alt}
              width={288}
              height={128}
              className="max-h-28 w-auto object-contain opacity-40 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LogoBar() {
  return (
    <section className="bg-white py-14">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <p className="text-center text-sm font-medium uppercase tracking-wider text-muted">
            Empresas que confian en nosotros
          </p>
        </ScrollReveal>
      </div>

      <div className="mt-8 flex flex-col gap-6">
        <MarqueeRow logos={ROW_1} />
        <MarqueeRow logos={ROW_2} reverse />
      </div>
    </section>
  );
}
