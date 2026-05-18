/**
 * Geotia rikssegl — sirkulært logosegl med konsentriske gullringer,
 * beading-prikker mellom ringene, "GEOTIA"/"· RIKETS · SEGL ·" som
 * buet tekst, og en sentral kompass-stjerne på navy bunn.
 *
 * Kilde: _visuelle_proever/assets/riks-segl.svg
 * Endring av denne komponenten skal speile endring i kilde-SVG-en
 * og loggføres i _visuelle_proever/ENDRINGSLOGG.md.
 *
 * Skal IKKE inneholde noe årstall.
 */
export function RiksSegl({
  size = 78,
  className,
  title = "Geotia rikssegl",
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={title}
      className={className}
    >
      <title>{title}</title>
      <defs>
        <radialGradient id="seglBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#f5ead0" />
          <stop offset="55%" stopColor="#ecdcb1" />
          <stop offset="100%" stopColor="#e2cf9c" />
        </radialGradient>
        <linearGradient id="seglGoldBright" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#e1c06c" />
          <stop offset="100%" stopColor="#b8892f" />
        </linearGradient>
        <path id="seglTopArc" d="M 30 100 A 70 70 0 0 1 170 100" fill="none" />
        <path id="seglBottomArc" d="M 30 100 A 70 70 0 0 0 170 100" fill="none" />
      </defs>

      {/* Ytre gullring */}
      <circle cx="100" cy="100" r="96" fill="url(#seglBg)" stroke="#b8892f" strokeWidth="2" />
      {/* Indre gullring */}
      <circle cx="100" cy="100" r="84" fill="none" stroke="#b8892f" strokeWidth="1" />

      {/* Beading-prikker mellom ringene */}
      <g fill="#7e5a18">
        <circle cx="100" cy="11" r="1.2" />
        <circle cx="123" cy="14" r="1.2" />
        <circle cx="144" cy="23" r="1.2" />
        <circle cx="162" cy="37" r="1.2" />
        <circle cx="175" cy="55" r="1.2" />
        <circle cx="184" cy="76" r="1.2" />
        <circle cx="187" cy="100" r="1.2" />
        <circle cx="184" cy="123" r="1.2" />
        <circle cx="175" cy="144" r="1.2" />
        <circle cx="162" cy="162" r="1.2" />
        <circle cx="144" cy="176" r="1.2" />
        <circle cx="123" cy="184" r="1.2" />
        <circle cx="100" cy="188" r="1.2" />
        <circle cx="77" cy="184" r="1.2" />
        <circle cx="56" cy="176" r="1.2" />
        <circle cx="38" cy="162" r="1.2" />
        <circle cx="25" cy="144" r="1.2" />
        <circle cx="16" cy="123" r="1.2" />
        <circle cx="13" cy="100" r="1.2" />
        <circle cx="16" cy="76" r="1.2" />
        <circle cx="25" cy="55" r="1.2" />
        <circle cx="38" cy="37" r="1.2" />
        <circle cx="56" cy="23" r="1.2" />
        <circle cx="77" cy="14" r="1.2" />
      </g>

      {/* Topptekst: GEOTIA */}
      <text fontFamily="var(--font-display)" fontSize="13" fontWeight="900" fill="#0a2b3f" letterSpacing="5">
        <textPath href="#seglTopArc" startOffset="50%" textAnchor="middle">
          GEOTIA
        </textPath>
      </text>
      {/* Bunntekst: · RIKETS · SEGL · */}
      <text fontFamily="var(--font-display)" fontSize="9" fontWeight="700" fill="#5e1d27" letterSpacing="4">
        <textPath href="#seglBottomArc" startOffset="50%" textAnchor="middle">
          · RIKETS · SEGL ·
        </textPath>
      </text>

      {/* Indre medaljong (navy disk) */}
      <circle cx="100" cy="100" r="42" fill="#0a2b3f" stroke="#b8892f" strokeWidth="1.5" />
      <circle cx="100" cy="100" r="38" fill="none" stroke="#b8892f" strokeWidth="0.6" opacity="0.6" />

      {/* Kompass-stjerne i senter */}
      <g transform="translate(100 100)">
        <path
          d="M 0 -32 L 4 0 L 0 32 L -4 0 Z"
          fill="url(#seglGoldBright)"
          stroke="#7e5a18"
          strokeWidth="0.4"
        />
        <path
          d="M -32 0 L 0 -4 L 32 0 L 0 4 Z"
          fill="url(#seglGoldBright)"
          stroke="#7e5a18"
          strokeWidth="0.4"
        />
        <path
          d="M 0 -18 L 13 -13 L 18 0 L 13 13 L 0 18 L -13 13 L -18 0 L -13 -13 Z"
          fill="none"
          stroke="#b8892f"
          strokeWidth="0.6"
          opacity="0.7"
        />
        <circle r="3" fill="#e1c06c" stroke="#7e5a18" strokeWidth="0.6" />
      </g>
    </svg>
  );
}
