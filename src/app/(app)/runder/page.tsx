import Link from "next/link";
import { Edit3, LockKeyhole, Plus, ShieldCheck } from "lucide-react";

import { Section } from "@/components/section";
import { lockRoundAction } from "@/app/actions";
import { computeRound } from "@/lib/scoring";
import { getAppState, makeEmptyRound } from "@/lib/store";
import { dateLabel, formatKm } from "@/lib/utils";
import { RoundForm } from "@/components/round-form";
import { SlowGeoRoundLauncher } from "@/components/slowgeo-round-launcher";
import type { RoundStatus } from "@/lib/types";

export const metadata = {
  title: "Runder",
};

export default async function RoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const state = await getAppState();
  const sortedRounds = [...state.rounds].sort((a, b) => b.number - a.number);

  return (
    <div className="space-y-6">
      <div className="geotia-frame rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          Spillregister
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          Runder og protokoller
        </h1>
        <p className="mt-3 max-w-3xl text-[#60553f]">
          Før fasit, geotenes svar, km og hendelser. Kartografen kan regne avstander,
          men GeoVAR lar deg fortsatt overstyre når verden oppfører seg urimelig.
        </p>
        <p className="mt-4 rounded border border-[#c49a3c]/35 bg-[#fff7e6] px-3 py-2 text-sm leading-6 text-[#4f412b]">
          Poengrekken følger antall gyldige deltakere i runden. Kattometeret beregner
          fortsatt snittet av de tre dårligste for desertering og ugyldige svar.
        </p>
      </div>

      {params.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {params.error}
        </div>
      ) : null}

      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "last"
            ? "Protokollen er låst. Kattometeret har talt."
            : params.status === "apnet"
              ? "SlowGeo-runden er åpnet."
              : "Protokollen er lagret."}
        </div>
      ) : null}

      <Section title="Ny SlowGeo" eyebrow="Street View og pin-svar">
        <SlowGeoRoundLauncher />
      </Section>

      <Section title="Manuell protokoll" eyebrow="Embetsverkets hurtigskjema">
        <RoundForm round={makeEmptyRound()} />
      </Section>

      <Section title="Rundearkiv" eyebrow="Løpende register">
        {sortedRounds.length ? (
          <>
          <div className="grid gap-3 md:hidden">
            {sortedRounds.map((round) => {
              const computed = computeRound(round, state.players);
              const statusLabel: Record<RoundStatus, string> = {
                draft: "Utkast",
                open: "Åpen",
                revealed: "Fasit vist",
                locked: "Låst",
              };
              return (
                <article key={round.id} className="rounded border border-[#d8ded0] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">Runde #{round.number}</p>
                      <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{round.name}</h2>
                      <p className="mt-1 text-sm text-[#5b6257]">{dateLabel(round.date)}</p>
                    </div>
                    <span className="rounded border border-[#d8ded0] bg-[#f7f8f5] px-2 py-1 text-xs font-semibold">
                      {statusLabel[round.status]}
                    </span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <MobileMetric label="Fasit" value={round.status === "open" && round.challenge ? "Skjult" : round.answer || "-"} />
                    <MobileMetric label="Deltakere" value={computed.participantCount} />
                    <MobileMetric label="Straff" value={formatKm(computed.worstThreeAverage)} />
                    <MobileMetric label="Status" value={statusLabel[round.status]} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/runder/${round.id}`}
                      className="inline-flex h-9 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
                    >
                      <Edit3 className="h-4 w-4" aria-hidden="true" />
                      Åpne
                    </Link>
                    {round.status === "draft" || round.status === "revealed" ? (
                      <form action={lockRoundAction}>
                        <input type="hidden" name="id" value={round.id} />
                        <button
                          type="submit"
                          className="inline-flex h-9 items-center gap-2 rounded bg-[#285c45] px-3 text-sm font-semibold text-white"
                        >
                          <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                          Lås
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[940px] text-left text-sm">
              <thead className="border-b border-[#d8ded0] text-xs uppercase tracking-[0.12em] text-[#5b6257]">
                <tr>
                  <th className="py-2 pr-3">#</th>
                  <th className="py-2 pr-3">Runde</th>
                  <th className="py-2 pr-3">Dato</th>
                  <th className="py-2 pr-3">Fasit</th>
                  <th className="py-2 pr-3 text-right">Deltakere</th>
                  <th className="py-2 pr-3 text-right">Kattometerstraff</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 text-right">Handling</th>
                </tr>
              </thead>
              <tbody>
                {sortedRounds.map((round) => {
                  const computed = computeRound(round, state.players);
                  const statusLabel: Record<RoundStatus, string> = {
                    draft: "Utkast",
                    open: "Åpen",
                    revealed: "Fasit vist",
                    locked: "Låst",
                  };
                  return (
                    <tr key={round.id} className="border-b border-[#eef1eb] last:border-b-0">
                      <td className="py-3 pr-3 font-mono text-[#8e3030]">{round.number}</td>
                      <td className="py-3 pr-3 font-semibold text-[#203c62]">{round.name}</td>
                      <td className="py-3 pr-3">{dateLabel(round.date)}</td>
                      <td className="py-3 pr-3">
                        {round.status === "open" && round.challenge ? "Skjult til fasit" : round.answer || "-"}
                      </td>
                      <td className="py-3 pr-3 text-right">{computed.participantCount}</td>
                      <td className="py-3 pr-3 text-right">{formatKm(computed.worstThreeAverage)}</td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex rounded border border-[#d8ded0] bg-[#f7f8f5] px-2 py-1 text-xs font-semibold">
                          {statusLabel[round.status]}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/runder/${round.id}`}
                            className="inline-flex h-9 items-center gap-2 rounded border border-[#d8ded0] bg-white px-3 text-sm font-semibold text-[#203c62]"
                          >
                            <Edit3 className="h-4 w-4" aria-hidden="true" />
                            Åpne
                          </Link>
                          {round.status === "draft" || round.status === "revealed" ? (
                            <form action={lockRoundAction}>
                              <input type="hidden" name="id" value={round.id} />
                              <button
                                type="submit"
                                className="inline-flex h-9 items-center gap-2 rounded bg-[#285c45] px-3 text-sm font-semibold text-white"
                              >
                                <LockKeyhole className="h-4 w-4" aria-hidden="true" />
                                Lås
                              </button>
                            </form>
                          ) : round.status === "locked" ? (
                            <span className="inline-flex h-9 items-center gap-2 rounded bg-[#285c45]/10 px-3 text-sm font-semibold text-[#285c45]">
                              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                              Ført
                            </span>
                          ) : (
                            <span className="inline-flex h-9 items-center gap-2 rounded bg-[#b8892f]/10 px-3 text-sm font-semibold text-[#7b591d]">
                              Åpen
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-[#b8892f] bg-[#b8892f]/8 p-5">
            <p className="flex items-center gap-2 text-lg font-semibold text-[#7b591d]">
              <Plus className="h-5 w-5" aria-hidden="true" />
              Ingen runder ført ennå.
            </p>
            <p className="mt-2 text-sm text-[#5b6257]">
              Første låste protokoll blir rikets nye år null for denne appen.
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded border border-[#d8c48c] bg-[#fff7e6] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mt-1 font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}
