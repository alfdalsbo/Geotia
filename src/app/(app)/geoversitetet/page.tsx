import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import {
  ArrowRight,
  Archive,
  BadgeCheck,
  BookOpen,
  Crown,
  Footprints,
  Gavel,
  GraduationCap,
  Landmark,
  LockKeyhole,
  MapPinned,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";

import { ExpandableImage } from "@/components/expandable-image";
import { Section, StatTile } from "@/components/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { getCurrentGeot } from "@/lib/auth";
import {
  canViewGeoversitetet,
  geoversitetetAssetUrl,
  geoversitetetCatalog,
  type DiplomarkivEntry,
  type Fakultet,
  type Geofessorprofil,
} from "@/lib/geoversitetet";

export const metadata = {
  title: "Geoversitetet",
};

export default async function GeoversitetetPage() {
  const currentGeot = await getCurrentGeot();
  if (!currentGeot || !canViewGeoversitetet(currentGeot.id)) {
    notFound();
  }

  const catalog = geoversitetetCatalog;
  const totalCourses = catalog.fakulteter.reduce((sum, fakultet) => sum + fakultet.fag.length, 0);

  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>
              <LockKeyhole className="h-3.5 w-3.5" aria-hidden="true" />
              Strengt internt · Universitas Geotiae
            </Eyebrow>
            <h1 className="geo-hero-title">Geoversitetet</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              {catalog.navn} er Geotias offisielle akademiske maskineri for
              kjennelære, øyberedskap, kattologi, parabologi og den krevende
              kunsten å virke klok etter fasit. Her føres professorater,
              grader, eksamener, Annales og riksarkiv med alvorlig glimt i
              embetsøyet.
            </p>
            <Ornament>{catalog.motto}</Ornament>
            <div className="geo-hero-actions">
              <Link href="/tredje-kollegium" className="btn btn-quiet">
                Tilbake til Kollegiet
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <Link href="/arkiv/kjennelaere" className="btn btn-wax">
                Kjennelærearkivet
                <MapPinned className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="geo-hero-poster">
            <ExpandableImage
              src={geoversitetetAssetUrl("assets/geoversitetet-logo.jpeg")}
              alt="Geoversitetets segl"
              sizes="(min-width: 1024px) 36vw, 100vw"
              className="relative aspect-square min-h-[280px] w-full sm:min-h-[420px]"
              imageClassName="object-contain p-8"
              caption="Geoversitetet · Universitas Geotiae · Terra et Scientia"
              priority
              unoptimized
            />
          </div>
        </div>
        <div className="geo-winner-band">
          <div>
            <p className="label">Status · {catalog.status}</p>
            <p className="value">
              Kun Tredje Kollegium har foreløpig adgang. Resten av riket kan
              mistenke at institusjonen finnes, men ikke føre bevis.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile label="Fakulteter" value={catalog.fakulteter.length} detail={`${totalCourses} kurs i katalogen`} tone="gold" index={0} />
        <StatTile label="Geofessorer" value={catalog.geofessorer.length} detail="Diplomført og høytidelig mistenkt" tone="blue" index={1} />
        <StatTile label="Grader" value={catalog.grader.length} detail="Fra cand.geo. til loc.susp." tone="green" index={2} />
        <StatTile label="Organer" value={catalog.organer.length} detail="Et embetsverk for hver panikk" tone="red" index={3} />
      </div>

      <Section
        title="Diplomarkiv"
        eyebrow="Segl, titler og akademisk pondus"
        action={
          <span className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fdf7e8] px-3 text-sm font-semibold text-[#062b40]">
            <Crown className="h-4 w-4" aria-hidden="true" />
            Internt arkiv
          </span>
        }
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.diplomarkiv.map((diplom) => (
            <DiplomCard key={diplom.navn} diplom={diplom} />
          ))}
        </div>
      </Section>

      <Section title="Studieløp og grader" eyebrow="Akademisk orden og studieprogresjon">
        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            {catalog.grader.map((grad) => (
              <article key={grad.kode} className="rounded border border-[#d8c48c] bg-white/72 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c2430]">{grad.kode}</p>
                <h2 className="font-display mt-1 text-2xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
                  {grad.navn}
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">{grad.kort}</p>
                <p className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#654517]">
                  {grad.krav}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-3">
            {catalog.studieprogresjon.map((trinn, index) => (
              <article key={trinn.nivå} className="archive-card">
                <div className="flex items-start gap-4">
                  <div className="crown-icon">
                    <Footprints className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
                      Trinn {index + 1}
                    </p>
                    <h3 className="break-words">{trinn.nivå}</h3>
                    <p className="lead-detail">{trinn.kjennetegn}</p>
                    <p className="mt-3 text-sm leading-6 text-[#273125]">{trinn.opprykk}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Fakulteter og fag" eyebrow="Katalog ført av Senatus Academicus">
        <div className="grid gap-4 lg:grid-cols-2">
          {catalog.fakulteter.map((fakultet) => (
            <FakultetCard key={fakultet.id} fakultet={fakultet} />
          ))}
        </div>
      </Section>

      <Section title="Geofessorprofiler" eyebrow="Embeter, teorier og tilkalling">
        <div className="grid gap-4 xl:grid-cols-2">
          {catalog.geofessorprofiler.map((profil) => (
            <GeofessorProfileCard key={profil.navn} profil={profil} />
          ))}
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <Section title="Eksamener" eyebrow="Pinsal, panikk og offentlig forsvar">
          <div className="grid gap-3">
            {catalog.eksamener.map((eksamen) => (
              <article key={eksamen.kode} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c2430]">{eksamen.kode}</p>
                    <h2 className="font-display mt-1 text-xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
                      {eksamen.navn}
                    </h2>
                  </div>
                  <span className="rounded border border-[#c49a3c]/45 bg-[#fdf7e8] px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[#654517]">
                    {eksamen.form}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-6 text-[#4f412b]">{eksamen.sensur}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Organer" eyebrow="Når vitsen trenger embetsverk">
          <div className="space-y-3">
            {catalog.organer.map((organ) => (
              <article key={organ.navn} className="rounded border border-[#d8c48c] bg-white/72 p-4">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                  <Landmark className="h-4 w-4" aria-hidden="true" />
                  Institusjon
                </p>
                <h2 className="font-display mt-2 text-xl font-semibold text-[#062b40]">{organ.navn}</h2>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">{organ.mandat}</p>
                <p className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#654517]">
                  {organ.når_aktiveres}
                </p>
              </article>
            ))}
          </div>
        </Section>
      </div>

      <Section title="Øyologi og beredskap" eyebrow="OYO-101 · kurs opprettet i panikk">
        <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <ExpandableImage
            src={geoversitetetAssetUrl("assets/oyologi-kunngjoring.jpeg")}
            alt="Kunngjøring for introduksjon til Øyologi"
            sizes="(min-width: 1024px) 42vw, 100vw"
            className="relative aspect-[3/4] min-h-[420px] w-full border border-[#c49a3c]/55 bg-[#061d2b]"
            imageClassName="object-contain"
            caption="OYO-101 · Rare øyer, kystlinjer og andre geografiske kuriositeter"
            unoptimized
          />
          <div className="space-y-4">
            <article className="rounded border border-[#c49a3c]/45 bg-[#061d2b] p-5 text-[#fdf7e8]">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
                Offentlig melding fra Geoversitetet
              </p>
              <h2 className="font-display mt-2 text-3xl font-semibold uppercase tracking-[0.08em]">
                Fakultet for Insulologi og Øyvitenskap
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#eadcbd]">
                Maptap-rundene har avdekket kunnskapshull. Fakultetet er derfor
                opprettet med umiddelbar virkning, særlig for kandidater som
                nylig behandlet Guam, Fiji, Bermuda eller Azorene med
                utilbørlig letthet.
              </p>
            </article>
            <div className="grid gap-3 sm:grid-cols-2">
              {["Øyer ingen kan plassere", "Bukter alle glemmer", "Kystlinjer som burde vært gjenkjent", "Territorier med komplisert flaggforhold"].map((punkt) => (
                <div key={punkt} className="rounded border border-[#d8c48c] bg-white/72 p-4 text-sm font-semibold leading-6 text-[#4f412b]">
                  {punkt}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Section>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title={catalog.annales.navn} eyebrow={catalog.annales.status} className="xl:col-span-1">
          <p className="mb-4 text-sm leading-6 text-[#60553f]">{catalog.annales.første_utgave}</p>
          <div className="space-y-2">
            {catalog.annales.poster.map((post) => (
              <p key={post} className="rounded border border-[#d8c48c] bg-white/72 px-3 py-2 text-sm font-semibold text-[#062b40]">
                {post}
              </p>
            ))}
          </div>
        </Section>

        <Section title="Feltmanual" eyebrow="Kandidater under kartpress" className="xl:col-span-1">
          <div className="space-y-3">
            {catalog.feltmanual.map((regel) => (
              <article key={regel.regel} className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-3">
                <h2 className="font-display text-lg font-semibold text-[#062b40]">{regel.regel}</h2>
                <p className="mt-1 text-sm leading-6 text-[#4f412b]">{regel.forklaring}</p>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Riksarkiv" eyebrow="Feil som nekter å dø" className="xl:col-span-1">
          <div className="space-y-3">
            {catalog.riksarkiv.map((entry) => (
              <article key={entry.kategori} className="rounded border border-[#d8c48c] bg-white/72 p-3">
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                  <Archive className="h-4 w-4" aria-hidden="true" />
                  {entry.kategori}
                </p>
                <p className="mt-2 text-sm leading-6 text-[#4f412b]">{entry.bruk}</p>
              </article>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function DiplomCard({ diplom }: { diplom: DiplomarkivEntry }) {
  return (
    <article className="archive-card">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">
            {diplom.status.replace(/_/g, " ")}
          </p>
          <h3 className="break-words">{diplom.navn}</h3>
          <p className="lead-detail">{diplom.rolle}</p>
        </div>
        <div className="crown-icon">
          <BadgeCheck className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <ExpandableImage
        src={geoversitetetAssetUrl(diplom.asset)}
        alt={`Diplom for ${diplom.navn}`}
        sizes="(min-width: 1024px) 42vw, 100vw"
        className="relative mt-4 aspect-[16/10] min-h-[220px] w-full border border-[#c49a3c]/45 bg-[#061d2b]"
        imageClassName="object-contain"
        caption={`${diplom.navn} · ${diplom.rolle}`}
        unoptimized
      />
    </article>
  );
}

function FakultetCard({ fakultet }: { fakultet: Fakultet }) {
  return (
    <article className="rounded border border-[#c49a3c]/45 bg-[#fffaf0] p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 flex-none place-items-center rounded-full border border-[#b8892f] bg-[#061d2b] text-[#f5d27a]">
          <GraduationCap className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-[#7c2430]">
            {fakultet.dekan ?? "Fakultet"}
          </p>
          <h2 className="font-display mt-1 text-2xl font-semibold uppercase tracking-[0.06em] text-[#062b40]">
            {fakultet.navn}
          </h2>
          {fakultet.norsk_navn ? <p className="mt-1 text-sm font-semibold text-[#654517]">{fakultet.norsk_navn}</p> : null}
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#4f412b]">{fakultet.beskrivelse}</p>
      {fakultet.motto ? (
        <p className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3 text-sm font-semibold italic text-[#654517]">
          {fakultet.motto} {fakultet.motto_norsk ? `· ${fakultet.motto_norsk}` : ""}
        </p>
      ) : null}
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
            <Landmark className="h-4 w-4" aria-hidden="true" />
            Avdelinger
          </p>
          <ul className="space-y-2 text-sm leading-6 text-[#4f412b]">
            {fakultet.avdelinger.map((avdeling) => (
              <li key={avdeling} className="rounded border border-[#d8c48c] bg-white/70 px-3 py-2">
                {avdeling}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            Fag
          </p>
          <ul className="space-y-2 text-sm leading-6 text-[#4f412b]">
            {fakultet.fag.map((fag) => (
              <li key={fag.kode} className="rounded border border-[#d8ded0] bg-white/70 px-3 py-2">
                <span className="font-bold text-[#062b40]">{fag.kode}</span> · {fag.navn}
                <span className="mt-1 block text-xs text-[#60553f]">{fag.kort}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </article>
  );
}

function GeofessorProfileCard({ profil }: { profil: Geofessorprofil }) {
  return (
    <article className="archive-card">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]">{profil.embete}</p>
          <h3 className="break-words">{profil.navn}</h3>
        </div>
        <div className="crown-icon">
          <Users className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
      <p className="lead-detail mt-3">{profil.signaturteori}</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded border border-[#d8c48c] bg-white/72 p-3">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
            <ScrollText className="h-4 w-4" aria-hidden="true" />
            Læresetninger
          </p>
          <ul className="space-y-2 text-sm leading-6 text-[#4f412b]">
            {profil.læresetninger.map((setning) => (
              <li key={setning}>{setning}</li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <FactBox icon={<ShieldCheck className="h-4 w-4" aria-hidden="true" />} label="Avverger" text={profil.avverger} />
          <FactBox icon={<Gavel className="h-4 w-4" aria-hidden="true" />} label="Tilkalles" text={profil.tilkalles} />
        </div>
      </div>
    </article>
  );
}

function FactBox({ icon, label, text }: { icon: ReactNode; label: string; text: string }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-white/72 p-3">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
        {icon}
        {label}
      </p>
      <p className="mt-2 text-sm leading-6 text-[#4f412b]">{text}</p>
    </div>
  );
}
