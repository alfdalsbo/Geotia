import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight,
  Crown,
  Eye,
  Gavel,
  KeyRound,
  Landmark,
  LockKeyhole,
  Scale,
  ScrollText,
  ShieldCheck,
  TableProperties,
} from "lucide-react";

import { ExpandableImage } from "@/components/expandable-image";
import { Section, StatTile } from "@/components/section";
import { getCurrentGeot } from "@/lib/auth";
import {
  getThirdCollegeSeat,
  isThirdCollegeMember,
  thirdCollegeMotto,
  thirdCollegePrivileges,
  thirdCollegeSeats,
} from "@/lib/kollegium";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "Tredje Kollegium",
};

export default async function ThirdCollegePage() {
  const currentGeot = await getCurrentGeot();
  if (!currentGeot || !isThirdCollegeMember(currentGeot.id)) {
    notFound();
  }

  const state = await getAppState();
  const currentSeat = getThirdCollegeSeat(currentGeot.id);
  const standings = computeStandings(state.players, state.rounds);
  const standingByPlayerId = new Map(standings.map((standing) => [standing.player.id, standing]));
  const playerById = new Map(state.players.map((player) => [player.id, player]));
  const partyById = new Map(state.parties.map((party) => [party.id, party]));
  const lockedRounds = state.rounds.filter((round) => round.status === "locked");
  const draftRounds = state.rounds.filter((round) => round.status === "draft");
  const latestRound = lockedRounds.at(-1);
  const computedLatest = latestRound ? computeRound(latestRound, state.players) : null;
  const openProposals = state.geotingProposals.filter((proposal) => proposal.status === "open");
  const votingProposals = state.geotingProposals.filter((proposal) => proposal.status === "voting");
  const collegeStandings = standings.filter((standing) => isThirdCollegeMember(standing.player.id));
  const collegePoints = collegeStandings.reduce((sum, standing) => sum + standing.totalPoints, 0);
  const totalPoints = standings.reduce((sum, standing) => sum + standing.totalPoints, 0);
  const collegePointShare = totalPoints > 0 ? Math.round((collegePoints / totalPoints) * 100) : 0;
  const topNonCollege = standings.find((standing) => !isThirdCollegeMember(standing.player.id));
  const skam = [...standings].sort((a, b) => b.totalKattometer - a.totalKattometer)[0];
  const precision = [...standings]
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];

  const memberRows = thirdCollegeSeats.map((seat) => {
    const player = playerById.get(seat.playerId);
    const party = partyById.get(seat.partyId);
    const standing = standingByPlayerId.get(seat.playerId);
    return { seat, player, party, standing };
  });

  return (
    <div className="space-y-7">
      <section className="overflow-hidden rounded border border-[#c49a3c]/70 bg-[#061d2b] text-[#fff7e6] shadow-[0_22px_48px_rgba(0,0,0,0.28)]">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.78fr)]">
          <div className="p-5 sm:p-8 lg:p-10">
            <div className="inline-flex items-center gap-2 rounded border border-[#c49a3c]/55 bg-[#020b11]/45 px-3 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#e1c06c]">
              <LockKeyhole className="h-4 w-4" aria-hidden="true" />
              Strengt internt · 3K
            </div>
            <h1 className="font-display mt-5 text-5xl font-semibold tracking-normal sm:text-7xl">
              Tredje Kollegium
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-[#eadcbd]">
              Geotias dype stat er ikke et organ. Det er et blikk, tre stoler
              og en usedvanlig høytidelig mistanke om at riket trenger en sal
              bak salen. SS, PKK og IRA samles her når statsapparatet må vite
              mer enn det offisielt vet.
            </p>

            <div className="geotia-ornament mt-7 text-center text-sm font-semibold uppercase tracking-[0.18em] text-[#e1c06c]">
              <span>{thirdCollegeMotto}</span>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
                  Din stol
                </p>
                <p className="font-display mt-2 text-2xl font-semibold">
                  {currentSeat?.seal ?? "Skjult segl"}
                </p>
                <p className="mt-2 text-sm text-[#eadcbd]">{currentSeat?.office}</p>
              </div>
              <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
                  Dekknavn
                </p>
                <p className="font-display mt-2 text-2xl font-semibold">
                  {currentSeat?.codename ?? "Ingen spor"}
                </p>
                <p className="mt-2 text-sm text-[#eadcbd]">Innlogget som {currentGeot.shortName}</p>
              </div>
              <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6]/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#e1c06c]">
                  Synlighet
                </p>
                <p className="font-display mt-2 text-2xl font-semibold">Null</p>
                <p className="mt-2 text-sm text-[#eadcbd]">For resten av riket finnes ikke fanen.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-[#c49a3c]/35 bg-[#020b11] lg:border-l lg:border-t-0">
            <ExpandableImage
              src="/tredje-kollegium/segl"
              alt="Seglet til Tredje Kollegium"
              sizes="(min-width: 1024px) 42vw, 100vw"
              className="relative aspect-square min-h-[420px] w-full"
              imageClassName="object-cover"
              caption="Tredje Kollegium · de som aldri tar feil"
              priority
              unoptimized
            />
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <StatTile
          label="Kollegiets poengandel"
          value={totalPoints > 0 ? `${collegePointShare}%` : "-"}
          detail={`${formatNumber(collegePoints)} av ${formatNumber(totalPoints)} førte poeng`}
          tone="gold"
        />
        <StatTile
          label="Åpne saker"
          value={openProposals.length + votingProposals.length}
          detail={votingProposals.length ? `${votingProposals.length} sak i urnen` : "Ingen urne brenner"}
          tone="red"
        />
        <StatTile
          label="Utkast under duken"
          value={draftRounds.length}
          detail="Runder som ennå kan formes i stillhet"
          tone="blue"
        />
        <StatTile
          label="Ytre utfordrer"
          value={topNonCollege?.player.shortName ?? "-"}
          detail={topNonCollege ? `${topNonCollege.totalPoints} poeng utenfor salen` : "Ingen data"}
          tone="green"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Section
          title="Indre protokoll"
          eyebrow="SS · PKK · IRA"
          action={
            <span className="inline-flex h-10 items-center gap-2 rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]">
              <Eye className="h-4 w-4" aria-hidden="true" />
              Kun tre par øyne
            </span>
          }
        >
          <div className="grid gap-4 lg:grid-cols-3">
            {memberRows.map(({ seat, player, party, standing }) => (
              <article
                key={seat.playerId}
                className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#7c2430]">
                      {seat.seal} · {seat.partyId.toUpperCase()}
                    </p>
                    <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                      {player?.shortName ?? seat.playerId}
                    </h2>
                  </div>
                  <span
                    className="h-10 w-2 rounded-full"
                    style={{ background: player?.color ?? party?.color ?? "#c49a3c" }}
                  />
                </div>
                <p className="mt-3 text-sm font-semibold text-[#161713]">{seat.office}</p>
                <p className="mt-2 text-sm leading-6 text-[#60553f]">{seat.oversight}</p>
                <div className="mt-4 grid gap-2 text-sm">
                  <p className="flex items-center justify-between border-t border-[#c49a3c]/25 pt-3">
                    <span className="text-[#60553f]">Rang</span>
                    <span className="font-semibold">{standing ? `#${standing.rank}` : "-"}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#60553f]">Poeng</span>
                    <span className="font-semibold">{standing?.totalPoints ?? 0}</span>
                  </p>
                  <p className="flex items-center justify-between">
                    <span className="text-[#60553f]">Kattometer</span>
                    <span className="font-semibold">{formatKm(standing?.totalKattometer)}</span>
                  </p>
                </div>
              </article>
            ))}
          </div>
        </Section>

        <Section title="Utvidede rettigheter" eyebrow="Mørkelysmandat">
          <div className="space-y-3">
            {thirdCollegePrivileges.map((privilege) => (
              <div
                key={privilege}
                className="flex items-start gap-3 rounded border border-[#d8c48c] bg-white/72 p-3 text-sm leading-6"
              >
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[#194832]" aria-hidden="true" />
                <span>{privilege}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded border border-[#7c2430]/25 bg-[#7c2430]/10 p-4 text-sm leading-6 text-[#4f1d24]">
            <p className="font-semibold">Sirkulær 3K-001</p>
            <p className="mt-1">
              Dersom hele riket mener saken er ferdig, kan Tredje Kollegium
              protokollføre at etterarbeidet nettopp har begynt.
            </p>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section
          title="Operativt overblikk"
          eyebrow="Dypstatens tavle"
          action={
            <Link
              href="/geotinget"
              className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
            >
              Til GeoTinget
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          }
        >
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Gavel className="mt-0.5 h-5 w-5 text-[#7c2430]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Saker i bevegelse</p>
                <p className="mt-1 text-[#60553f]">
                  {openProposals.length} åpne og {votingProposals.length} i avstemning.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TableProperties className="mt-0.5 h-5 w-5 text-[#194832]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Siste låste runde</p>
                <p className="mt-1 text-[#60553f]">
                  {computedLatest
                    ? `${computedLatest.name} · ${dateLabel(computedLatest.date)} · vinner ${computedLatest.winnerNames.join(", ")}`
                    : "Ingen låst runde ennå."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Scale className="mt-0.5 h-5 w-5 text-[#654517]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Kattometerets skygge</p>
                <p className="mt-1 text-[#60553f]">
                  {skam ? `${skam.player.shortName} bærer ${formatKm(skam.totalKattometer)}.` : "Ingen skam ført."}
                </p>
              </div>
            </div>
          </div>
        </Section>

        <Section title="Maktbalanse" eyebrow="Offisielt uoffisielt">
          <div className="space-y-3 text-sm">
            {collegeStandings.map((standing) => (
              <div
                key={standing.player.id}
                className="flex items-center justify-between rounded border border-[#d8ded0] bg-white p-3"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <Crown className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                  {standing.player.shortName}
                </span>
                <span>{standing.totalPoints} p</span>
              </div>
            ))}
            <div className="rounded border border-[#c49a3c]/35 bg-[#fff7e6] p-3 text-[#60553f]">
              Kollegiets samlede kattometer:{" "}
              <span className="font-semibold text-[#161713]">
                {formatKm(collegeStandings.reduce((sum, standing) => sum + standing.totalKattometer, 0))}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Varsellamper" eyebrow="Taus alarm">
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Landmark className="mt-0.5 h-5 w-5 text-[#062b40]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Rikets front</p>
                <p className="mt-1 text-[#60553f]">
                  {standings[0]
                    ? `${standings[0].player.shortName} leder med ${standings[0].totalPoints} poeng.`
                    : "Ingen leder er ført."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <KeyRound className="mt-0.5 h-5 w-5 text-[#7c2430]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Presisjonsnøkkel</p>
                <p className="mt-1 text-[#60553f]">
                  {precision
                    ? `${precision.player.shortName} har lavest kattometer: ${formatKm(precision.totalKattometer)}.`
                    : "Kattometeret venter på data."}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <ScrollText className="mt-0.5 h-5 w-5 text-[#654517]" aria-hidden="true" />
              <div>
                <p className="font-semibold text-[#062b40]">Nærmeste pergament</p>
                <p className="mt-1 text-[#60553f]">
                  {draftRounds.at(-1)?.name || "Ingen åpne rundeutkast ligger fremme."}
                </p>
              </div>
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
