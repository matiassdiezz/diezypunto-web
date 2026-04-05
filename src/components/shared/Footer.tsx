import Link from "next/link";
import Image from "next/image";
import { telegramUrl } from "@/lib/telegram";
import { CATALOG_COUNT_LABEL } from "@/lib/catalog-count";

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

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      {/* Brand logos */}
      <div className="border-b border-border px-6 py-8 lg:px-16">
        <p className="mb-5 text-center text-xs font-medium uppercase tracking-wider text-muted">
          Marcas que nos acompañan
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10">
          {BRANDS.map((brand) => (
            <Image
              key={brand.alt}
              src={brand.src}
              alt={brand.alt}
              width={96}
              height={48}
              className="h-8 w-auto object-contain opacity-40 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 hover:scale-105 sm:h-10"
            />
          ))}
        </div>
      </div>

      <div className="px-6 lg:px-16 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <Image
              src="/logo-diezypunto.webp"
              alt="diezypunto"
              width={140}
              height={42}
              className="h-9 w-auto"
            />
            <p className="mt-2 text-sm text-muted">
              Merchandising corporativo con {CATALOG_COUNT_LABEL} productos. Calidad y
              personalización para tu marca.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href="https://www.instagram.com/diezypunto"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors duration-300 hover:text-foreground"
                aria-label="Instagram"
              >
                <svg className="h-5 w-5 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
              <a
                href="https://www.facebook.com/diezypuntomerchandising"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted transition-colors duration-300 hover:text-foreground"
                aria-label="Facebook"
              >
                <svg className="h-5 w-5 transition-transform duration-300 hover:scale-110" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Navegación
            </h4>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted transition-colors duration-300 hover:text-foreground">
                Inicio
              </Link>
              <Link href="/catalogo" className="text-sm text-muted transition-colors duration-300 hover:text-foreground">
                Catálogo
              </Link>
              <Link href="/carrito" className="text-sm text-muted transition-colors duration-300 hover:text-foreground">
                Carrito
              </Link>
              <Link href="/quienes-somos" className="text-sm text-muted transition-colors duration-300 hover:text-foreground">
                Quiénes Somos
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Contacto
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
              <a
                href="https://wa.me/541162345062"
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-300 hover:text-foreground"
              >
                WhatsApp: 011 6234-5062
              </a>
              <a
                href={telegramUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-300 hover:text-foreground"
              >
                Telegram
              </a>
              <a
                href="mailto:info@diezypunto.com.ar"
                className="transition-colors duration-300 hover:text-foreground"
              >
                info@diezypunto.com.ar
              </a>
              <p>Av. del Mirador 290, Nordelta</p>
              <p>Lun a Vie 8–13h / 14–17h</p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Información
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
              <p>Mercado Pago, transferencia bancaria, efectivo y más.</p>
              <p>Facturación A y B disponible.</p>
              <p>Envíos a todo el país. CABA y GBA en 24-72hs.</p>
              <p>Cambios y devoluciones dentro de los 10 días.</p>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted">
          &copy; {new Date().getFullYear()} diezypunto. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
