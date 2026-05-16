import Link from "next/link";
import { Flame, ScrollText } from "lucide-react";

export function SarajevoVideo() {
  return (
    <section className="geotia-frame geotia-sarajevo rounded">
      <div className="grid gap-0 xl:grid-cols-[minmax(0,1.15fr)_0.85fr]">
        <div className="bg-[#061d2b] p-3 sm:p-4">
          <video
            className="aspect-video w-full rounded border border-[#c49a3c]/45 bg-black object-contain shadow-[0_18px_42px_rgba(0,0,0,0.28)]"
            controls
            preload="metadata"
            poster="/geotia-assets/sarajevo-dagen-poster.jpg"
          >
            <source src="/geotia-assets/sarajevo-dagen.mp4" type="video/mp4" />
            Nettleseren nekter å avspille Sarajevodagens primærkilde.
          </video>
        </div>
        <div className="p-5 sm:p-7">
          <div className="inline-flex items-center gap-2 rounded border border-[#7c2430]/25 bg-[#7c2430]/10 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
            <Flame className="h-4 w-4" aria-hidden="true" />
            Sarajevodagen
          </div>
          <h2 className="font-display mt-4 text-4xl font-semibold tracking-normal text-[#062b40]">
            Opphavet til dagen geo nesten døde
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#4f412b]">
            Dette er Sarajevodagens primærkilde: et legendarisk klipp fra Geotias
            mytiske forhistorie, ført her med den alvor situasjonen fortjener.
            Klippet skal sees som arkiv, advarsel og nasjonal høytid i samme åndedrag.
          </p>
          <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-3 text-sm italic leading-6 text-[#654517]">
            “Å ta en Sarajevo: være svært selvsikker, gå ekstremt høyt ut OG treffe blink.”
          </p>
          <Link
            href="/arkiv/merkedager"
            className="mt-5 inline-flex h-10 items-center gap-2 rounded bg-[#062b40] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0d3b4e]"
          >
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Se merkedagene
          </Link>
        </div>
      </div>
    </section>
  );
}
