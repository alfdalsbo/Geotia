import { cn } from "@/lib/utils";

/**
 * Eyebrow — Cinzel-caps med wide letter-spacing og en liten roterte
 * burgunder-diamant foran teksten. Brukes over h1 i hero-bokser, og
 * over h2 i seksjoner som ikke har full banderol.
 *
 * Tone-varianter bytter både diamantfargen og rammen.
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 9 for kanonisk CSS.
 */
export type EyebrowTone = "burgundy" | "navy" | "green" | "gold";

export function Eyebrow({
  children,
  tone = "burgundy",
  className,
}: {
  children: React.ReactNode;
  tone?: EyebrowTone;
  className?: string;
}) {
  return (
    <div className={cn("eyebrow", tone !== "burgundy" && `tone-${tone}`, className)}>
      <span className="ico" aria-hidden="true" />
      {children}
    </div>
  );
}
