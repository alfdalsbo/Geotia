import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  FileText,
  Gavel,
  Landmark,
  MapPinned,
  ScrollText,
  Trophy,
  Users,
} from "lucide-react";

import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { archiveSections } from "@/lib/archive";
import { archive } from "@/lib/seed";

export const metadata = {
  title: "Oppslagsverk",
};

const iconBySlug = {
  kanon: FileText,
  grunnloven: ScrollText,
  leksikon: BookOpen,
  kjennelaere: MapPinned,
  geoter: Users,
  partier: Landmark,
  merkedager: CalendarDays,
  episoder: ScrollText,
  geotinget: Gavel,
  "gammel-slowgeo": Trophy,
  konespillet: Gavel,
};

export default function ArchivePage() {
  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Riksarkivet · propaganda med fotnoter · Kapittel V</Eyebrow>
            <h1 className="geo-hero-title">Riksarkivet</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Lore, grunnlov, språk, merkedager og historikk samlet i ett
              ærverdig arkiv for små geografiske feil som vokste opp og ble
              nasjonale hendelser.
            </p>
            <Ornament>Sannhet · orden · forvirrelse</Ornament>
          </div>
          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-arkivet.svg"
              alt="Riksvåpen for Arkivet"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
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
              prefetch={false}
              className="geotia-panel group rounded p-5 transition hover:-translate-y-0.5 hover:border-[#c49a3c]"
            >
              <div className="relative z-10 flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded border border-[#c49a3c]/45 bg-[#062b40] text-[#e1c06c]">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
                  <LinkPendingIndicator />
                </span>
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
