import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BookOpen, CalendarDays, Gavel, Landmark, ScrollText, Users } from "lucide-react";

import { Section } from "@/components/section";
import { archiveSections } from "@/lib/archive";
import { archive } from "@/lib/seed";

export const metadata = {
  title: "Oppslagsverk",
};

const iconBySlug = {
  grunnloven: ScrollText,
  leksikon: BookOpen,
  geoter: Users,
  partier: Landmark,
  merkedager: CalendarDays,
  geotinget: Gavel,
  "gammel-slowgeo": ScrollText,
};

export default function ArchivePage() {
  return (
    <div className="space-y-7">
      <section className="geotia-frame rounded">
        <div className="grid gap-0 lg:grid-cols-[1fr_420px]">
          <div className="p-5 sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
              Oppslagsverk · riksarkiv · propaganda med fotnoter
            </p>
            <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
              Geotias riksarkiv
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[#4f412b]">
              Lore, grunnlov, språk, merkedager og historikk samlet i ett
              ærverdig arkiv for små geografiske feil som vokste opp og ble
              nasjonale hendelser.
            </p>
            <div className="geotia-ornament mt-6 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#194832]">
              <span>Sannhet · orden · forvirrelse</span>
            </div>
          </div>
          <div className="relative min-h-[330px] border-t border-[#c49a3c]/35 bg-[#061d2b] lg:border-l lg:border-t-0">
            <Image
              src="/geotia-assets/party-overview.png"
              alt="Geotia partioversikt"
              fill
              sizes="(min-width: 1024px) 420px, 100vw"
              className="object-cover object-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#061d2b]/80 via-transparent to-transparent" />
          </div>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {archiveSections.map((section) => {
          const Icon = iconBySlug[section.slug] ?? BookOpen;
          return (
            <Link
              key={section.slug}
              href={`/arkiv/${section.slug}`}
              className="geotia-panel group rounded p-5 transition hover:-translate-y-0.5 hover:border-[#c49a3c]"
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded border border-[#c49a3c]/45 bg-[#062b40] text-[#e1c06c]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
              </div>
              <p className="relative z-10 mt-4 text-xs font-semibold uppercase tracking-[0.18em] text-[#7c2430]">
                {section.eyebrow}
              </p>
              <h2 className="font-display relative z-10 mt-1 text-2xl font-semibold text-[#062b40]">
                {section.title}
              </h2>
              <p className="relative z-10 mt-2 text-sm leading-6 text-[#60553f]">{section.description}</p>
            </Link>
          );
        })}
      </div>

      <Section title="Hurtigoppslag" eyebrow="Fra leksikonet">
        <div className="grid gap-3 md:grid-cols-2">
          {archive.lexicon.slice(0, 8).map((entry) => (
            <div key={entry.term} className="rounded border border-[#c49a3c]/30 bg-[#fff7e6] p-4">
              <p className="font-display text-xl font-semibold text-[#062b40]">{entry.term}</p>
              <p className="mt-1 text-sm leading-6 text-[#60553f]">{entry.definition}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
