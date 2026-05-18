import { cn } from "@/lib/utils";

/**
 * RankMark — sirkulær medalje med romersk tall. Gull for #1, sølv for
 * #2, bronse for #3, dimmet gull for #4+.
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 13 (.rank-mark).
 */
const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];

export function RankMark({ rank, className }: { rank: number; className?: string }) {
  const toneClass =
    rank === 1
      ? undefined
      : rank === 2
        ? "silver"
        : rank === 3
          ? "bronze"
          : "dimmed";
  const display = ROMAN_NUMERALS[rank - 1] ?? String(rank);
  return (
    <span
      className={cn("rank-mark", toneClass, className)}
      aria-label={`Plass ${rank}`}
    >
      {display}
    </span>
  );
}
