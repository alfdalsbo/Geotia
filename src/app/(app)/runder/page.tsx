import Link from "next/link";
import { Edit3, LockKeyhole, Plus, ShieldCheck } from "lucide-react";

import { Section } from "@/components/section";
import { lockRoundAction } from "@/app/actions";
import { computeRound } from "@/lib/scoring";
import { getAppState, makeEmptyRound } from "@/lib/store";
import { dateLabel, formatKm } from "@/lib/utils";
import { RoundForm } from "@/components/round-form";

export const metadata = {
  title: "Runder",
};

export default async function RoundsPage({
  searchParams,
}: {
  searchParams?: Promise<{ status?: string }>;
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
          Før km, deltakelse og hendelser. Ikke skriv faktiske svarsteder; staten har valgt
          lavere byråkrati og høyere overlevelse.
        </p>
      </div>

      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "last" ? "Protokollen er låst. Kattometeret har talt." : "Protokollen er lagret."}
        </div>
      ) : null}

      <Section title="Ny runde" eyebrow="Embetsverkets hurtigskjema">
        <RoundForm round={makeEmptyRound()} />
      </Section>

      <Section title="Rundearkiv" eyebrow="Løpende register">
        {sortedRounds.length ? (
          <div className="overflow-x-auto">
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
                  return (
                    <tr key={round.id} className="border-b border-[#eef1eb] last:border-b-0">
                      <td className="py-3 pr-3 font-mono text-[#8e3030]">{round.number}</td>
                      <td className="py-3 pr-3 font-semibold text-[#203c62]">{round.name}</td>
                      <td className="py-3 pr-3">{dateLabel(round.date)}</td>
                      <td className="py-3 pr-3">{round.answer || "-"}</td>
                      <td className="py-3 pr-3 text-right">{computed.participantCount}</td>
                      <td className="py-3 pr-3 text-right">{formatKm(computed.worstThreeAverage)}</td>
                      <td className="py-3 pr-3">
                        <span className="inline-flex rounded border border-[#d8ded0] bg-[#f7f8f5] px-2 py-1 text-xs font-semibold">
                          {round.status === "locked" ? "Låst" : "Utkast"}
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
                          {round.status === "draft" ? (
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
                          ) : (
                            <span className="inline-flex h-9 items-center gap-2 rounded bg-[#285c45]/10 px-3 text-sm font-semibold text-[#285c45]">
                              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                              Ført
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
