"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-0">
        {items.map((item, i) => (
          <li key={i} className="flex items-center">
            {i > 0 && <span className="mx-1.5" aria-hidden="true">&gt;</span>}
            {item.href && i < items.length - 1 ? (
              <Link href={item.href} className="hover:text-foreground">
                {item.label}
              </Link>
            ) : (
              <span
                className={i === items.length - 1 ? "text-foreground" : ""}
                {...(i === items.length - 1 ? { "aria-current": "page" as const } : {})}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
