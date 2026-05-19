"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { itemMatches, type RiksNavItem } from "@/lib/route-context";

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
        const active = itemMatches(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={active ? "active" : undefined}
            aria-current={active ? "page" : undefined}
            aria-label={item.label}
            title={item.description}
          >
            <span className="geo-nav-label">{item.label}</span>
            <span className="geo-nav-description" aria-hidden="true">
              {item.description}
            </span>
            <LinkPendingIndicator className="text-[#e1c06c]" />
          </Link>
        );
      })}
      {extras}
    </nav>
  );
}
