import Link from "next/link";
import { ArrowRight, Clock, ExternalLink, MapPinned, Trophy } from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { SlowGeoRoundLauncher } from "@/components/slowgeo-round-launcher";
import { SlowGeoShareButton } from "@/components/slowgeo-share-button";
import { computeRound, computeStandings } from "@/lib/scoring";
import { getAppState } from "@/lib/store";
import { dateLabel, dateTimeLabel, formatKm } from "@/lib/utils";

export const metadata = {
  title: "SlowGeo",
};

export default async function SlowGeoGamePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getAppState();
  const standings = computeStandings(state.players, state.rounds);
  const activeRounds = state.rounds
    .filter((round) => round.challenge && round.status === "open")
    .sort((a, b) => String(a.deadlineAt).localeCompare(String(b.deadlineAt)));
  const recentRounds = state.rounds
    .filter((round) => round.challenge && round.status !== "open")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);
  const lockedRounds = state.rounds.filter((round) => round.challenge && round.status === "locked");
  const leader = standings[0];
  const kattometerLeader = standings
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];

  return (
    <div className="space-y-7">
      <section className="geotia-frame rounded p-5 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          SlowGeo · Street View · krangletråd
        </p>
        <h1 className="font-display mt-2 text-5xl font-semibold tracking-normal text-[#062b40]">
          SlowGeo
        </h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-[#4f412b]">
          Start et bilde, del det i samtaletråden, la geotene krangle seg varme,
          og lås pin-svarene før fasit vises.
        </p>
      </section>

      {params.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {params.error}
        </div>
      ) : null}
      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "apnet"
            ? "SlowGeo-runden er åpnet."
            : "SlowGeo-rommet er oppdatert."}
        </div>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile label="Åpne runder" value={activeRounds.length} detail="Klar for krangling" tone="green" />
        <StatTile label="Poengleder" value={leader?.player.shortName ?? "-"} detail={`${leader?.totalPoints ?? 0} poeng`} tone="blue" />
        <StatTile label="Lavest kattometer" value={kattometerLeader?.player.shortName ?? "-"} detail={formatKm(kattometerLeader?.totalKattometer)} tone="gold" />
      </div>

      <Section title="Start nytt SlowGeo" eyebrow="Nytt bilde til tråden">
        <SlowGeoRoundLauncher />
      </Section>

      <Section title="Aktive SlowGeo-runder" eyebrow="Åpne bilder og låste pins">
        {activeRounds.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeRounds.map((round) => {
              const submitted = round.results.filter((result) => result.guessLocation).length;
              const shareUrl = `/slowgeo/${round.id}`;
              return (
                <article key={round.id} className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">
                        Runde #{round.number}
                      </p>
                      <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                        {round.name}
                      </h2>
                    </div>
                    <p className="inline-flex items-center gap-2 rounded border border-[#d8ded0] bg-[#f7f8f5] px-3 py-2 text-sm font-semibold text-[#203c62]">
                      <Clock className="h-4 w-4" aria-hidden="true" />
                      {dateTimeLabel(round.deadlineAt)}
                    </p>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#5b6257]">
                    {submitted}/{round.results.length} pin-svar er låst. Fasit er skjult til reveal.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/runder/${round.id}`}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
                    >
                      Åpne spill
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <SlowGeoShareButton
                      title={`SlowGeo: ${round.name}`}
                      text={`Nytt SlowGeo-bilde er oppe: ${round.name}. Krangle først, sett pinnen etterpå.`}
                      url={shareUrl}
                      label="Del bildet"
                      copiedLabel="Bildelenke kopiert"
                    />
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-[#7b591d]">
              <MapPinned className="h-5 w-5" aria-hidden="true" />
              Ingen åpne SlowGeo-runder.
            </p>
            <p className="mt-2 text-sm text-[#5b6257]">Start et nytt bilde øverst når tråden trenger brensel.</p>
          </div>
        )}
      </Section>

      <Section
        title="Siste SlowGeo-resultater"
        eyebrow="Fasit, vinner og protokoll"
        action={
          <Link
            href="/tabeller"
            className="inline-flex h-10 items-center gap-2 rounded bg-[#fff7e6] px-3 text-sm font-semibold text-[#062b40]"
          >
            Tabell
            <Trophy className="h-4 w-4" aria-hidden="true" />
          </Link>
        }
      >
        {recentRounds.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentRounds.map((round) => {
              const computed = computeRound(round, state.players);
              const winnerKm = computed.results.find((result) => result.rank === 1)?.actualKm;
              return (
                <article key={round.id} className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">
                    {dateLabel(round.date)} · {round.status === "locked" ? "Låst" : "Fasit vist"}
                  </p>
                  <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">
                    {round.name}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[#5b6257]">
                    Vinner: {computed.winnerNames.join(", ") || "-"} · beste bom {formatKm(winnerKm)}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/runder/${round.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
                    >
                      Protokoll
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </Link>
                    <Link
                      href={`/slowgeo/${round.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded border border-[#d8ded0] bg-[#f7f8f5] px-3 text-sm font-semibold text-[#203c62]"
                    >
                      Delingskort
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5">
            <p className="text-sm text-[#5b6257]">
              Ingen avslørte Street View-runder ennå. Første fasit blir stående her.
            </p>
          </div>
        )}
        {lockedRounds.length === 0 ? null : (
          <p className="mt-4 text-sm text-[#5b6257]">
            {lockedRounds.length} SlowGeo-runder er låst i den offisielle protokollen.
          </p>
        )}
      </Section>
    </div>
  );
}
