"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";

export type RiksNavItem = {
  href: string;
  label: string;
};

/**
 * RiksNav — Cinzel-knapper med L-formede hjørne-merker via ::before
 * og ::after (definert i globals.css). Aktiv-tilstand vises ved at
 * lenken matcher current pathname.
 *
 * Bruker usePathname() — derfor "use client".
 *
 * `extras` rendres etter lenkene (typisk logout-form).
 */
export function RiksNav({
  items,
  extras,
}: {
  items: readonly RiksNavItem[];
  extras?: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <nav className="geo-nav" aria-label="Hovednavigasjon">
      {items.map((item) => {
        const active =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
          >
            <span>{item.label}</span>
            <LinkPendingIndicator className="text-[#e1c06c]" />
          </Link>
        );
      })}
      {extras}
    </nav>
  );
}
