import Link from "next/link";
import { ArrowRight, Clock, MapPinned, ShieldAlert, Trash2 } from "lucide-react";

import { deleteSlowGeoRoundAction } from "@/app/actions";
import { LinkPendingIndicator } from "@/components/link-pending-indicator";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { Section } from "@/components/section";
import { SlowGeoRoundLauncher } from "@/components/slowgeo-round-launcher";
import { SlowGeoSubnav } from "@/components/slowgeo-subnav";
import { SlowGeoThreadShareButton } from "@/components/slowgeo-thread-share-button";
import { canManageSlowGeoAdmin, canStartSlowGeoRound } from "@/lib/admin-permissions";
import { getCurrentGeot } from "@/lib/auth";
import { pickGeoticLine, slowGeoEmptyStateLines } from "@/lib/geotia-jargon";
import { getSlowGeoMode, slowGeoModeLabels } from "@/lib/slowgeo";
import { buildOpenSlowGeoShareTextOptions } from "@/lib/slowgeo-share";
import { getSlowGeoProgress, slowGeoDifficultyLabels } from "@/lib/slowgeo-insights";
import { getSlowGeoState } from "@/lib/store";
import type { Round } from "@/lib/types";
import { dateTimeLabel } from "@/lib/utils";

export const metadata = {
  title: "SlowGeo",
};

export default async function SlowGeoGamePage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; status?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const [state, currentGeot] = await Promise.all([getSlowGeoState(), getCurrentGeot()]);
  const canManageSlowGeo = canManageSlowGeoAdmin(currentGeot?.id);
  const canStartSlowGeo = canStartSlowGeoRound(currentGeot?.id);
  const activeRounds = state.rounds
    .filter((round) => round.challenge && round.status === "open")
    .sort((a, b) => slowGeoStartStamp(a) - slowGeoStartStamp(b) || a.number - b.number);
  const emptyLine = pickGeoticLine(slowGeoEmptyStateLines, "slowgeo-empty");

  return (
    <div className="space-y-7">
      <section className="geotia-frame grid gap-4 rounded p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
            SlowGeo · Spill nå
          </p>
          <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
            SlowGeo
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-[#4f412b]">
            Start et bilde, del det i samtaletråden og la geotene sette pinnen
            før fasiten låser runden i arkivet.
          </p>
        </div>
        <div className="rounded border border-[#c49a3c]/45 bg-[#fff7e6] px-4 py-3 text-sm font-semibold text-[#654517]">
          {activeRounds.length ? `${activeRounds.length} åpen runde venter på pin-svar.` : "Ingen åpen runde akkurat nå."}
        </div>
      </section>

      <SlowGeoSubnav />

      {params.error ? (
        <div className="rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-4 py-3 text-sm font-medium text-[#8e3030]">
          {params.error}
        </div>
      ) : null}
      {params.status ? (
        <div className="rounded border border-[#285c45]/25 bg-[#285c45]/8 px-4 py-3 text-sm font-medium text-[#285c45]">
          {params.status === "apnet"
            ? "SlowGeo-runden er åpnet."
            : params.status === "slowgeo-slettet"
              ? "SlowGeo-runden er slettet av Tredje Kollegium."
              : "SlowGeo-rommet er oppdatert."}
        </div>
      ) : null}

      {canStartSlowGeo ? (
        <Section title="Start SlowGeo" eyebrow="Nytt bilde til tråden">
          <SlowGeoRoundLauncher />
        </Section>
      ) : null}

      <div className="rounded border border-[#d8ded0] bg-white px-4 py-3 text-sm leading-6 text-[#5b6257] shadow-sm">
        <span className="font-semibold text-[#062b40]">{activeRounds.length} åpne runder.</span>{" "}
        Ferdige SlowGeoer føres rett til Fasitarkivet, uten resultatkø nederst i Spill nå-flaten.
      </div>

      <Section title="Aktive SlowGeo-runder" eyebrow="Pågår nå · fasit skjult">
        {activeRounds.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {activeRounds.map((round) => {
              const progress = getSlowGeoProgress(round);
              const shareUrl = `/slowgeo/${round.id}`;
              const mode = getSlowGeoMode(round);
              const difficulty = round.challenge?.difficulty ? slowGeoDifficultyLabels[round.challenge.difficulty] : null;
              return (
                <article key={round.id} className="rounded border border-[#d8ded0] bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">
                        Runde #{round.number} · {slowGeoModeLabels[mode]}
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
                    {progress.submittedCount}/{progress.totalCount} pin-svar er låst. Fasit er skjult til reveal.
                  </p>
                  <div className="mt-3 h-2 overflow-hidden rounded bg-[#eef1eb]">
                    <div
                      className="h-full rounded bg-[#285c45]"
                      style={{ width: `${Math.round((progress.submittedCount / Math.max(progress.totalCount, 1)) * 100)}%` }}
                    />
                  </div>
                  {round.challenge ? (
                    <div className="mt-3 rounded border border-[#c49a3c]/35 bg-[#fdf7e8] p-3 text-sm leading-6 text-[#4f412b]">
                      <span className="font-semibold text-[#7c2430]">{difficulty ?? "Umerket"}</span>
                      {round.challenge.theme ? ` · ${round.challenge.theme}` : ""}
                      {round.challenge.signature ? ` · ${round.challenge.signature}` : ""}
                    </div>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/runder/${round.id}`}
                      prefetch={false}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded bg-[#203c62] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
                    >
                      Åpne runden
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      <LinkPendingIndicator className="text-white" />
                    </Link>
                    <SlowGeoThreadShareButton
                      title={`SlowGeo: ${round.name}`}
                      texts={buildOpenSlowGeoShareTextOptions(round.name, round.id)}
                      url={shareUrl}
                      label="Del iMessage-tråden"
                      copiedLabel="Trådtekst kopiert"
                    />
                  </div>
                  {canManageSlowGeo ? (
                    <form
                      action={deleteSlowGeoRoundAction}
                      className="mt-4 rounded border border-[#8e3030]/25 bg-[#8e3030]/8 p-3"
                    >
                      <input type="hidden" name="round_id" value={round.id} />
                      <input type="hidden" name="return_to" value="/spill/slowgeo" />
                      <p className="mb-2 flex items-start gap-2 text-xs font-semibold leading-5 text-[#8e3030]">
                        <ShieldAlert className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
                        3K-nødrett: sletting fjerner runden helt fra spillrom, lenke og poenggrunnlag.
                      </p>
                      <PendingSubmitButton className="inline-flex min-h-10 items-center justify-center gap-2 rounded bg-[#8e3030] px-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#6f2424]">
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        Slett SlowGeo
                      </PendingSubmitButton>
                    </form>
                  ) : null}
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
            <p className="mt-2 text-sm text-[#5b6257]">{emptyLine}</p>
          </div>
        )}
      </Section>

    </div>
  );
}

function slowGeoStartStamp(round: Pick<Round, "slowGeoStartedAt" | "createdAt" | "number">) {
  const stamp = new Date(round.slowGeoStartedAt ?? round.createdAt).getTime();
  return Number.isFinite(stamp) ? stamp : round.number;
}
