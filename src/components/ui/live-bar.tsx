import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * LiveBar — felles skall for haste-meldinger over hele appen.
 * Brukes av GeotingGlobalAlert og SlowGeoGlobalAlert. Pakke 1-banderol
 * med Pakke 2-pulse (CSS-animasjon @keyframes pulse-pip i globals.css).
 *
 * Returnerer null hvis item er null — kaller-komponenten håndterer
 * tom-tilstanden ved å sende null.
 */
export type LiveBarItem = {
  /** Korttekst over tittel, store bokstaver med wide letter-spacing.
   * F.eks. "Aktiv avstemning · GeoTinget" */
  tag: string;
  /** Valgfri kode i monospace (DM Mono) før tittelen.
   * F.eks. "SAK · 14B" eller "RUNDE · 17" */
  caseCode?: string;
  /** Hovedteksten i Cormorant Garamond. Emojis tillatt. */
  title: string;
  /** Nedteller-element (kan være streng eller komponent, f.eks. <GeotingMiniCountdown />). */
  deadlineLabel: React.ReactNode;
  /** Lenke som åpner riktig flate. */
  actionHref: string;
  /** Knappe-tekst, f.eks. "Gå til avstemning →". */
  actionLabel: string;
};

export function LiveBar({
  item,
  variant = "full",
}: {
  item: LiveBarItem | null;
  variant?: "full" | "compact";
}) {
  if (!item) return null;
  return (
    <div className={cn("live-bar", variant === "compact" && "live-bar--compact")} role="status" aria-live="polite">
      <div className="live-bar-inner">
        <span className="pulse-pip" aria-hidden="true" />
        <div className="min-w-0">
          <div className="live-tag">{item.tag}</div>
          <div className="live-case">
            {item.caseCode ? <code>{item.caseCode}</code> : null}
            {item.title}
          </div>
        </div>
        <div className="live-bar-timer">{item.deadlineLabel}</div>
        <Link
          href={item.actionHref}
          prefetch={false}
          className="btn btn-brass btn-small live-bar-action"
        >
          {item.actionLabel}
        </Link>
      </div>
    </div>
  );
}
