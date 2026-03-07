import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold text-accent">diezypunto</h3>
            <p className="mt-2 text-sm text-muted">
              Merchandising corporativo con +1,400 productos. Calidad y
              personalizacion para tu marca.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Navegacion
            </h4>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/" className="text-sm text-muted hover:text-foreground">
                Inicio
              </Link>
              <Link
                href="/catalogo"
                className="text-sm text-muted hover:text-foreground"
              >
                Catalogo
              </Link>
              <Link
                href="/presupuesto"
                className="text-sm text-muted hover:text-foreground"
              >
                Presupuesto
              </Link>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider text-muted">
              Contacto
            </h4>
            <div className="mt-3 flex flex-col gap-2 text-sm text-muted">
              <a
                href="https://wa.me/5491168385566"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground"
              >
                WhatsApp
              </a>
              <a
                href="mailto:info@diezypunto.com.ar"
                className="hover:text-foreground"
              >
                info@diezypunto.com.ar
              </a>
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
