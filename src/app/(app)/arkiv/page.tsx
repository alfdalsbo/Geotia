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
              className="archive-card group block transition hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="crown-icon">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
                  <LinkPendingIndicator />
                </span>
              </div>
              <p
                className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {section.eyebrow}
              </p>
              <h3>{section.title}</h3>
              <p className="lead-detail mt-2 text-sm">{section.description}</p>
            </Link>
          );
        })}
      </div>

      <Section title="Hurtigoppslag" eyebrow="Fra leksikonet">
        <div className="grid gap-3 md:grid-cols-2">
          {archive.lexicon.slice(0, 8).map((entry) => (
            <div key={entry.term} className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-4 shadow-sm">
              <p className="font-display text-xl font-semibold text-[#062b40]">{entry.term}</p>
              <p className="mt-1 text-sm leading-6 text-[#60553f]">{entry.definition}</p>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
