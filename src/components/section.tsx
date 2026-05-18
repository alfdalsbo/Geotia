import { cn } from "@/lib/utils";

/**
 * Section — pergament-boks med banderol-header som har spisse
 * burgunder-ender. Tittelen i Cinzel, eyebrow i IM Fell italic.
 *
 * Props er bakoverkompatible med gammel Section. To NYE valgfrie props:
 *   - chapter: romersk eller arabisk kapittel-nr (renderes som
 *     " · Kapittel V" i eyebrow-banderolen).
 *   - tone: "default" | "active" (sistnevnte legger til operativ-aksent
 *     i Fase 3).
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 11 for kanonisk CSS.
 */
export function Section({
  title,
  eyebrow,
  chapter,
  tone = "default",
  children,
  className,
  action,
}: {
  title: string;
  eyebrow?: string;
  chapter?: string | number;
  tone?: "default" | "active";
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}) {
  const eyebrowText = chapter
    ? `${eyebrow ? `${eyebrow} · ` : ""}Kapittel ${chapter}`
    : eyebrow;
  return (
    <section
      className={cn(
        "geo-section min-w-0",
        tone === "active" && "geo-section--active",
        className,
      )}
    >
      <div className="geo-banner">
        <div className="min-w-0">
          {eyebrowText ? <span className="eyebrow-band">{eyebrowText}</span> : null}
          <h2>{title}</h2>
        </div>
        {action ? <div className="flex min-w-0 flex-wrap gap-2">{action}</div> : null}
      </div>
      <div className="geo-section-body">{children}</div>
    </section>
  );
}

/**
 * StatTile — beholder eksport-navn for bakoverkompatibilitet, men
 * intern impl er nå "Shield" med romertall-stempel og Cormorant-verdi.
 *
 * Nye valgfrie props:
 *   - index: tall fra 0+ som rendres som romersk tall i hjørne-stempelet.
 *     (Hvis ikke gitt, vises ingen stempel — bruk det kun i ekte
 *     sekvenser av tiles.)
 *
 * Tone-mapping:
 *   "blue"  → default navy stempel
 *   "green" → grønt stempel
 *   "red"   → burgunder stempel
 *   "gold"  → gull stempel
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 10.
 */
const SHIELD_TONE_CLASS: Record<StatTileTone, string> = {
  blue: "",
  green: "shield--green",
  red: "shield--red",
  gold: "shield--gold",
};

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export type StatTileTone = "blue" | "green" | "red" | "gold";

export function StatTile({
  label,
  value,
  detail,
  tone = "blue",
  index,
}: {
  label: string;
  value: React.ReactNode;
  detail?: React.ReactNode;
  tone?: StatTileTone;
  index?: number;
}) {
  return (
    <div className={cn("shield", SHIELD_TONE_CLASS[tone])}>
      {typeof index === "number" ? (
        <span className="num" aria-hidden="true">
          {ROMAN_NUMERALS[index] ?? String(index + 1)}
        </span>
      ) : null}
      <p className="label">{label}</p>
      <div className="value">{value}</div>
      {detail ? <p className="detail">{detail}</p> : null}
    </div>
  );
}
