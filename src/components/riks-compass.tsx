"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getRouteContext } from "@/lib/route-context";

export function RiksCompass() {
  const pathname = usePathname();
  const context = getRouteContext(pathname);

  return (
    <nav className="riks-compass" aria-label="Rikssti" data-testid="rikssti">
      <div className="riks-compass-inner">
        <span className="riks-compass-kicker">Rikssti</span>
        <ol>
          <li>
            <Link href="/" prefetch={false}>
              Geotia
            </Link>
          </li>
          <li>
            <Link href={context.primary.href} prefetch={false}>
              {context.primary.label}
            </Link>
          </li>
          {context.pageLabel !== context.primary.label ? (
            <li aria-current="page">{context.pageLabel}</li>
          ) : null}
        </ol>
        <span className="riks-compass-note">{context.primary.description}</span>
      </div>
    </nav>
  );
}
