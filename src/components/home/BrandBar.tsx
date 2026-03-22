import Image from "next/image";
import ScrollReveal from "../shared/ScrollReveal";

const BRANDS = [
  { src: "/brands/stanley.webp", alt: "Stanley" },
  { src: "/brands/samsonite.webp", alt: "Samsonite" },
  { src: "/brands/american.webp", alt: "American Tourister" },
  { src: "/brands/hershell.webp", alt: "Herschel" },
  { src: "/brands/waterdog.webp", alt: "Waterdog" },
  { src: "/brands/coleman.webp", alt: "Coleman" },
  { src: "/brands/cardon.webp", alt: "Cardón" },
  { src: "/brands/pampero.webp", alt: "Pampero" },
  { src: "/brands/waterman.webp", alt: "Waterman" },
  { src: "/brands/polarbox.webp", alt: "Polarbox" },
  { src: "/brands/callaway.webp", alt: "Callaway" },
];

export default function BrandBar() {
  return (
    <section className="py-16">
      <div className="px-6 lg:px-16">
        <ScrollReveal>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-12 bg-gradient-to-r from-transparent to-border" />
            <p className="text-center text-sm font-medium uppercase tracking-wider text-muted">
              Marcas que nos acompañan
            </p>
            <div className="h-px w-12 bg-gradient-to-l from-transparent to-border" />
          </div>
        </ScrollReveal>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-8 sm:gap-12">
          {BRANDS.map((brand) => (
            <div
              key={brand.alt}
              className="flex h-16 w-24 items-center justify-center sm:h-20 sm:w-32"
            >
              <Image
                src={brand.src}
                alt={brand.alt}
                width={128}
                height={80}
                className="max-h-14 w-auto object-contain opacity-50 grayscale transition-all duration-300 hover:opacity-100 hover:grayscale-0 sm:max-h-16"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
