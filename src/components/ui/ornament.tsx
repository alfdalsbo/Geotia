/**
 * Ornament — sentral separator-linje med gull-streker på hver side og
 * en liten 8-armet stjerne (eller annet symbol) på hver ende av teksten.
 * Brukes typisk i hero-bokser for å fremheve et motto.
 *
 * Se _visuelle_proever/RIKSPROTOKOLLEN.css § 9 (.ornament).
 */
export function Ornament({ children }: { children: React.ReactNode }) {
  return (
    <div className="ornament">
      <OrnamentStar />
      <span>{children}</span>
      <OrnamentStar />
    </div>
  );
}

function OrnamentStar() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 22 22"
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <path
        d="M11 1 L13 9 L21 11 L13 13 L11 21 L9 13 L1 11 L9 9 Z"
        fill="currentColor"
      />
    </svg>
  );
}
