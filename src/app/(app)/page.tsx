import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Footprints,
  Gavel,
  MapPinned,
  ScrollText,
  UserRound,
} from "lucide-react";

import { GeoGuessrTipTicker } from "@/components/geo-guessr-tip-ticker";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section, StatTile } from "@/components/section";
import { buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { getCurrentGeot } from "@/lib/auth";
import { getGeoGuessrTipDaySeed, selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { geotiaDashboardLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeoticOrderRows } from "@/lib/geotisk-orden";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, formatKm } from "@/lib/utils";

export const metadata = {
  title: "Kommandosentral",
};

const exploreCards = [
  {
    title: "SlowGeo",
    eyebrow: "Spillrommet",
    description: "Start runde, sett pinnen og se fasiten når protokollen låses.",
    href: "/spill/slowgeo",
    icon: MapPinned,
  },
  {
    title: "GeoTinget",
    eyebrow: "Rikets sal",
    description: "Send forslag, avlegg geo-ed og finn stemmeurnen når riket kaller.",
    href: "/geotinget",
    icon: Gavel,
  },
  {
    title: "Ordenen",
    eyebrow: "Borgerstigen",
    description: "Se hvordan en borger blir farlig nok til mer ansvar i Geotia.",
    href: "/ordenen",
    icon: Footprints,
  },
  {
    title: "Riksarkivet",
    eyebrow: "Leksikon og lore",
    description: "Grunnlov, partier, tegnlære, merkedager og gamle protokoller.",
    href: "/arkiv",
    icon: BookOpen,
  },
  {
    title: "Min geot",
    eyebrow: "Din riksmappe",
    description: "Din rang, ordensvei, partirolle og siste SlowGeo-spor.",
    href: "/min-geot",
    icon: UserRound,
  },
];

export default async function DashboardPage() {
  const [state, currentGeot] = await Promise.all([getAppState(), getCurrentGeot()]);
  const standings = computeStandings(state.players, state.rounds);
  const daySeed = getGeoGuessrTipDaySeed();
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const activeSlowGeoRounds = state.rounds.filter((round) => round.challenge && round.status === "open");
  const primarySlowGeoRound = activeSlowGeoRounds.at(0);
  const currentStanding = standings.find((standing) => standing.player.id === currentGeot?.id) ?? standings[0];
  const orderRows = getGeoticOrderRows(
    state.players,
    standings,
    state.geoterIndexAdjustments,
    state.geoticOrderAssessments,
  );
  const currentOrderRow = orderRows.find((row) => row.player.id === currentGeot?.id) ?? orderRows[0];
  const dashboardLine = pickGeoticLine(geotiaDashboardLines, daySeed);
  const dailyTips = selectGeoGuessrTips({
    placement: "dashboard",
    seed: daySeed,
    count: 3,
  });

  return (
    <div className="space-y-7">
      <section className="geo-hero">
        <div className="geo-hero-grid">
          <div className="geo-hero-text">
            <Eyebrow>Rikets kommandosentral · Kapittel I</Eyebrow>
            <h1 className="geo-hero-title">Geotia</h1>
            <p className="geo-hero-lead geo-hero-lead-dropcap">
              Et geotisk mikrounivers bygget på geografispill, brutal
              sannhetssøken og et statsapparat som fører riket med alvorlig
              smil. Kommandosentralen peker deg videre til rikets viktigste rom.
            </p>

            <Ornament>{dashboardLine}</Ornament>

            <div className="geo-hero-actions">
              <Link
                href="/spill/slowgeo"
                prefetch={false}
                className={buttonClass({ variant: "wax" })}
              >
                Start SlowGeo
                <MapPinned className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator className="text-white" />
              </Link>
              <Link
                href="/ordenen"
                prefetch={false}
                className={buttonClass({ variant: "quiet" })}
              >
                Gå ordensveien
                <Footprints className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator />
              </Link>
              <Link
                href="/arkiv"
                prefetch={false}
                className={buttonClass({ variant: "quiet" })}
              >
                Åpne Riksarkivet
                <BookOpen className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator />
              </Link>
            </div>
          </div>

          <div className="geo-hero-poster">
            <Image
              src="/illustrations/vapen-kommando.svg"
              alt="Riksvåpen for Kommandosentralen"
              width={300}
              height={350}
              priority
              style={{ width: "auto", maxHeight: "440px" }}
            />
          </div>
        </div>
        <div className="geo-winner-band">
          <div>
            <p className="label">Rikets nåsignal</p>
            <p className="value">
              {primarySlowGeoRound
                ? `SlowGeo pågår: ${primarySlowGeoRound.name}`
                : computedLatest
                  ? `Siste vinner: ${computedLatest.winnerNames.join(", ")}`
                  : "Riket venter på første låste SlowGeo-runde"}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Aktiv SlowGeo"
          value={activeSlowGeoRounds.length || "Ingen"}
          detail={primarySlowGeoRound ? "Åpen for pin-svar" : "Klar til ny runde"}
          tone="green"
          index={0}
        />
        <StatTile
          label="Din plass"
          value={currentStanding ? `#${currentStanding.rank}` : "-"}
          detail={currentStanding ? `${currentStanding.totalPoints} poeng` : "Ingen protokoll ennå"}
          tone="blue"
          index={1}
        />
        <StatTile
          label="Ordensvei"
          value={currentOrderRow?.rank.name ?? "-"}
          detail={currentOrderRow?.nextRank ? `${currentOrderRow.progressToNext}% mot neste` : "Fullført synlig stige"}
          tone="gold"
          index={2}
        />
        <StatTile
          label="Siste protokoll"
          value={computedLatest ? dateLabel(computedLatest.date) : "-"}
          detail={computedLatest ? computedLatest.name : "Embetsverket venter"}
          tone="red"
          index={3}
        />
      </div>

      <Section title="Utforsk Geotia" eyebrow="Institusjonene">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {exploreCards.map((card) => {
            const Icon = card.icon;
            return (
              <Link
                key={card.href}
                href={card.href}
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
                  {card.eyebrow}
                </p>
                <h3>{card.title}</h3>
                <p className="lead-detail mt-2 text-sm">{card.description}</p>
              </Link>
            );
          })}
        </div>
      </Section>

      <GeoGuessrTipTicker tips={dailyTips} />

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/tabeller" prefetch={false} className="archive-card group block transition hover:-translate-y-0.5">
          <Crown className="h-5 w-5 text-[#7c2430]" aria-hidden="true" />
          <h3 className="mt-3">Tabellkammeret</h3>
          <p className="lead-detail mt-2 text-sm">
            Full SlowGeo-tabell og Æreshallen ligger samlet utenfor toppnavigasjonen.
          </p>
        </Link>
        <Link href="/runder" prefetch={false} className="archive-card group block transition hover:-translate-y-0.5">
          <ScrollText className="h-5 w-5 text-[#7c2430]" aria-hidden="true" />
          <h3 className="mt-3">Rundeprotokollen</h3>
          <p className="lead-detail mt-2 text-sm">
            Arkiv og manuell etterkontroll når embetsverket trenger full kontroll.
          </p>
        </Link>
        <div className="archive-card">
          <MapPinned className="h-5 w-5 text-[#7c2430]" aria-hidden="true" />
          <h3 className="mt-3">Kattometeret</h3>
          <p className="lead-detail mt-2 text-sm">
            {computedLatest
              ? `Siste runde ga ${formatKm(computedLatest.worstThreeAverage)} i skammens snitt.`
              : "Første låste SlowGeo-runde vekker kattometeret."}
          </p>
        </div>
      </div>
    </div>
  );
}
