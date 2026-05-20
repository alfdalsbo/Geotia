import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Crown,
  Gavel,
  MapPinned,
  ScrollText,
  Trophy,
  UserRound,
} from "lucide-react";

import { GeoGuessrTipTicker } from "@/components/geo-guessr-tip-ticker";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { Section } from "@/components/section";
import { buttonClass } from "@/components/ui/button";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ornament } from "@/components/ui/ornament";
import { getCurrentGeot } from "@/lib/auth";
import { getGeoGuessrTipDaySeed, selectGeoGuessrTips } from "@/lib/geoguessr-tips";
import { geotiaDashboardLines, pickGeoticLine } from "@/lib/geotia-jargon";
import { getGeoticOrderRows } from "@/lib/geotisk-orden";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getActivityState } from "@/lib/store";
import { formatKm } from "@/lib/utils";

export const metadata = {
  title: "Kommandosentral",
};

export default async function DashboardPage() {
  const [state, currentGeot] = await Promise.all([getActivityState(), getCurrentGeot()]);
  const standings = computeStandings(state.players, state.rounds);
  const daySeed = getGeoGuessrTipDaySeed();
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const activeSlowGeoRounds = state.rounds.filter((round) => round.challenge && round.status === "open");
  const primarySlowGeoRound = activeSlowGeoRounds.at(0);
  const activeVotingProposals = state.geotingProposals.filter((proposal) => proposal.status === "voting");
  const primaryVotingProposal = activeVotingProposals.at(0);
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
  const recommendedAction = primarySlowGeoRound
    ? {
        title: "Åpne aktiv SlowGeo",
        detail: primarySlowGeoRound.name,
        href: `/runder/${primarySlowGeoRound.id}`,
        label: "Sett pinnen",
        icon: MapPinned,
      }
    : primaryVotingProposal
      ? {
          title: "Gå til Stemmeurnen",
          detail: primaryVotingProposal.title,
          href: "/geotinget/avstemninger",
          label: "Avgi stemme",
          icon: Gavel,
        }
      : {
          title: "Se Min geot",
          detail: currentOrderRow
            ? `${currentOrderRow.rank.name} · ${currentStanding?.totalPoints ?? 0} poeng`
            : "Riksmappe og ordensvei",
          href: "/min-geot",
          label: "Åpne riksmappe",
          icon: UserRound,
        };
  const RecommendedIcon = recommendedAction.icon;

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
                href={recommendedAction.href}
                prefetch={false}
                className={buttonClass({ variant: "wax" })}
              >
                {recommendedAction.label}
                <RecommendedIcon className="h-4 w-4" aria-hidden="true" />
                <LinkPendingIndicator className="text-white" />
              </Link>
              <Link
                href="/arkiv/ny-i-geotia"
                prefetch={false}
                className={buttonClass({ variant: "quiet" })}
              >
                Ny i Geotia
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

      <Section title="I dag i Geotia" eyebrow="Handling først, lore etterpå">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <TodayCard
            href={primarySlowGeoRound ? `/runder/${primarySlowGeoRound.id}` : "/spill/slowgeo"}
            icon={<MapPinned className="h-5 w-5" aria-hidden="true" />}
            eyebrow="SlowGeo"
            title={primarySlowGeoRound ? "Runde pågår" : "Ingen åpen runde"}
            detail={primarySlowGeoRound ? primarySlowGeoRound.name : "Start en ny runde når tråden er klar."}
            action={primarySlowGeoRound ? "Åpne runden" : "Start SlowGeo"}
          />
          <TodayCard
            href={primaryVotingProposal ? "/geotinget/avstemninger" : "/geotinget"}
            icon={<Gavel className="h-5 w-5" aria-hidden="true" />}
            eyebrow="GeoTinget"
            title={primaryVotingProposal ? "Stemmeurnen er åpen" : "Ingen åpen urne"}
            detail={primaryVotingProposal ? primaryVotingProposal.title : "Forslag kan fortsatt legges frem på Tingvollen."}
            action={primaryVotingProposal ? "Gå til urnen" : "Se Tingvollen"}
          />
          <TodayCard
            href="/min-geot"
            icon={<UserRound className="h-5 w-5" aria-hidden="true" />}
            eyebrow="Din status"
            title={currentStanding ? `#${currentStanding.rank} i SlowGeo` : "Riksmappe venter"}
            detail={currentOrderRow ? `${currentOrderRow.rank.name} · ${currentStanding?.totalPoints ?? 0} poeng` : "Se rollen din, merker og ordensvei."}
            action="Åpne Min geot"
          />
          <TodayCard
            href={recommendedAction.href}
            icon={<RecommendedIcon className="h-5 w-5" aria-hidden="true" />}
            eyebrow="Anbefalt neste handling"
            title={recommendedAction.title}
            detail={recommendedAction.detail}
            action={recommendedAction.label}
          />
        </div>
      </Section>

      <GeoGuessrTipTicker tips={dailyTips} />

      <Section title="Flere rom" eyebrow="Når dagens plikt er gjort">
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
            <h3 className="mt-3">Fasitarkivet</h3>
            <p className="lead-detail mt-2 text-sm">
              Ferdige SlowGeo-kort, vinnere og kartspor fra runder som er avslørt.
            </p>
          </Link>
          <Link href="/hall-of-fame" prefetch={false} className="archive-card group block transition hover:-translate-y-0.5">
            <Trophy className="h-5 w-5 text-[#7c2430]" aria-hidden="true" />
            <h3 className="mt-3">Æreshallen</h3>
            <p className="lead-detail mt-2 text-sm">
              {computedLatest
                ? `Siste runde ga ${formatKm(computedLatest.worstThreeAverage)} i skammens snitt.`
                : "Rekordene våkner når første SlowGeo-runde låses."}
            </p>
          </Link>
        </div>
      </Section>
    </div>
  );
}

function TodayCard({
  action,
  detail,
  eyebrow,
  href,
  icon,
  title,
}: {
  action: string;
  detail: string;
  eyebrow: string;
  href: string;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <Link href={href} prefetch={false} className="archive-card group block transition hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div className="crown-icon">{icon}</div>
        <span className="flex items-center gap-2">
          <ArrowRight className="h-5 w-5 text-[#7c2430] transition group-hover:translate-x-1" aria-hidden="true" />
          <LinkPendingIndicator />
        </span>
      </div>
      <p
        className="mt-3 text-[10px] font-bold uppercase tracking-[0.32em] text-[#7e5a18]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {eyebrow}
      </p>
      <h3>{title}</h3>
      <p className="lead-detail mt-2 text-sm">{detail}</p>
      <p className="mt-4 text-xs font-bold uppercase tracking-[0.18em] text-[#7c2430]">
        {action}
      </p>
    </Link>
  );
}
