import Link from "next/link";
import { Flame, ScrollText } from "lucide-react";

import { buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Stamp } from "@/components/ui/stamp";

/**
 * SarajevoVideo — filmplakat-innfatning rundt Sarajevodagens primærkilde.
 *
 * Designdetaljer (Pakke 1):
 * - Geo-hero-stilen rundt videoen (gull-ramme, hjørne-arabesker)
 * - Filmperforerte kanter rundt selve videoen (svarte hull i mørk navy-stripe)
 * - "VISES I RIKSFORUM"-stempel rotert øverst til høyre
 * - Cinzel-tittel + drop-cap + italic sitat
 */
export function SarajevoVideo() {
  return (
    <section className="geo-hero relative">
      <div className="absolute right-4 top-4 z-10">
        <Stamp tone="alarm">VISES I RIKSFORUM</Stamp>
      </div>
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div className="sarajevo-film-frame">
          <div className="film-perforation top" aria-hidden="true" />
          <video
            className="block aspect-video w-full bg-black object-contain"
            controls
            preload="metadata"
            poster="/geotia-assets/sarajevo-dagen-poster.jpg"
          >
            <source src="/geotia-assets/sarajevo-dagen.mp4" type="video/mp4" />
            Nettleseren nekter å avspille Sarajevodagens primærkilde.
          </video>
          <div className="film-perforation bottom" aria-hidden="true" />
        </div>
        <div className="p-5 sm:p-7">
          <Eyebrow>
            <Flame className="h-3.5 w-3.5" aria-hidden="true" />
            Sarajevodagen · 26. mai
          </Eyebrow>
          <h2 className="font-display text-3xl font-semibold uppercase tracking-[0.05em] text-[#062b40] sm:text-4xl">
            Opphavet til dagen geo nesten døde
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#3b2c12]" style={{ fontFamily: "var(--font-sans)" }}>
            <span
              className="float-left mr-2 mt-1 text-3xl font-bold leading-none text-[#5e1d27]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              D
            </span>
            ette er Sarajevodagens primærkilde: et legendarisk klipp fra
            Geotias mytiske forhistorie, ført her med den alvor situasjonen
            fortjener. Klippet skal sees som arkiv, advarsel og nasjonal
            høytid i samme åndedrag.
          </p>
          <p
            className="mt-4 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#654517]"
            style={{ fontFamily: "var(--font-italic)", fontStyle: "italic" }}
          >
            &ldquo;Å ta en Sarajevo: være svært selvsikker, gå ekstremt høyt ut
            OG treffe blink.&rdquo;
          </p>
          <Link
            href="/arkiv/merkedager"
            className={`${buttonClass({ variant: "wax", size: "small" })} mt-5`}
          >
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Se merkedagene
          </Link>
        </div>
      </div>
    </section>
  );
}
