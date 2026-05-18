import { cn } from "@/lib/utils";

/**
 * Stamp — operativ-stempel i DM Mono. Rotert -2° for stempel-følelse.
 *
 * 4 toner:
 *   - signal  (grønn) — SOLID, JEVN, ARKIVERT, OK
 *   - alarm   (rød)   — UROLIG, INDIA-RISK, ÅPEN URNE, EVIG REGISTRERT
 *   - brass   (gull)  — REKORD ARKIVERT, ÆRE FØRT
 *   - navy    (navy)  — PROTOKOLLFØRT, BEKREFTET
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 13 (.stamp).
 */
export type StampTone = "signal" | "alarm" | "brass" | "navy";

export function Stamp({
  children,
  tone = "signal",
  className,
}: {
  children: React.ReactNode;
  tone?: StampTone;
  className?: string;
}) {
  return <span className={cn("stamp", tone, className)}>{children}</span>;
}
