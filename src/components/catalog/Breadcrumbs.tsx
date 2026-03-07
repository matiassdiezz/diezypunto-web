"use client";

import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export default function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <nav className="text-sm text-muted">
      {items.map((item, i) => (
        <span key={i}>
          {i > 0 && <span className="mx-1.5">&gt;</span>}
          {item.href && i < items.length - 1 ? (
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          ) : (
            <span className={i === items.length - 1 ? "text-foreground" : ""}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
