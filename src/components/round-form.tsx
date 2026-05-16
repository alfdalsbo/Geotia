"use client";

import { useMemo, useState, useTransition } from "react";
import { Calculator, Loader2, MapPin, Save, ShieldCheck } from "lucide-react";

import { saveRoundAction } from "@/app/actions";
import { computeRound } from "@/lib/scoring";
import { competingPlayers } from "@/lib/seed";
import type { DistanceSource, GeoLocation, ResultStatus, Round } from "@/lib/types";
import { formatKm } from "@/lib/utils";

const statusOptions = [
  { value: "deltatt", label: "Deltatt" },
  { value: "ikke_deltatt", label: "Desertering" },
  { value: "ugyldig", label: "Ugyldig" },
] as const;

type PreviewResult = {
  location: GeoLocation | null;
  distanceKm: number | null;
};

function resultFor(round: Round, playerId: string) {
  return round.results.find((candidate) => candidate.playerId === playerId);
}

function numberValue(value: string) {
  const parsed = Number(value.replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
}

function locationText(location: GeoLocation | null | undefined) {
  if (!location) return "";
  return location.label.length > 118 ? `${location.label.slice(0, 118)}...` : location.label;
}

export function RoundForm({ round }: { round: Round }) {
  const [answer, setAnswer] = useState(round.answer);
  const [answerLocation, setAnswerLocation] = useState<GeoLocation | null>(round.answerLocation ?? null);
  const [guessTexts, setGuessTexts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      competingPlayers.map((player) => [player.id, resultFor(round, player.id)?.guessText ?? ""]),
    ),
  );
  const [geoResults, setGeoResults] = useState<Record<string, PreviewResult>>(() =>
    Object.fromEntries(
      competingPlayers.map((player) => {
        const result = resultFor(round, player.id);
        return [
          player.id,
          {
            location: result?.guessLocation ?? null,
            distanceKm: result?.distanceSource === "auto" ? result.actualKm : null,
          },
        ];
      }),
    ),
  );
  const [kmValues, setKmValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      competingPlayers.map((player) => {
        const actualKm = resultFor(round, player.id)?.actualKm;
        return [player.id, typeof actualKm === "number" ? String(actualKm) : ""];
      }),
    ),
  );
  const [statusValues, setStatusValues] = useState<Record<string, ResultStatus>>(() =>
    Object.fromEntries(
      competingPlayers.map((player) => [player.id, resultFor(round, player.id)?.status ?? "ikke_deltatt"]),
    ) as Record<string, ResultStatus>,
  );
  const [distanceSources, setDistanceSources] = useState<Record<string, DistanceSource | "">>(() =>
    Object.fromEntries(
      competingPlayers.map((player) => [player.id, resultFor(round, player.id)?.distanceSource ?? ""]),
    ),
  );
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const computed = useMemo(() => {
    return computeRound(
      {
        ...round,
        answer,
        answerLocation,
        results: competingPlayers.map((player) => {
          const actualKm = numberValue(kmValues[player.id] ?? "");
          return {
            playerId: player.id,
            status: statusValues[player.id] ?? "ikke_deltatt",
            actualKm,
            guessText: guessTexts[player.id] ?? "",
            guessLocation: geoResults[player.id]?.location ?? null,
            distanceSource: distanceSources[player.id] || null,
            note: resultFor(round, player.id)?.note ?? "",
          };
        }),
      },
      competingPlayers,
    );
  }, [answer, answerLocation, distanceSources, geoResults, guessTexts, kmValues, round, statusValues]);

  function calculateDistances() {
    setError("");
    const guesses = competingPlayers
      .map((player) => ({ playerId: player.id, text: (guessTexts[player.id] ?? "").trim() }))
      .filter((guess) => guess.text);

    if (!answer.trim() || guesses.length === 0) {
      setError("Før fasit og minst ett geot-svar før kartografen vekkes.");
      return;
    }

    startTransition(async () => {
      const response = await fetch("/api/geocode/round-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer, guesses }),
      });
      const payload = (await response.json()) as {
        answerLocation?: GeoLocation | null;
        results?: Array<{ playerId: string; location: GeoLocation | null; distanceKm: number | null }>;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Kartografen fant ikke veien.");
        return;
      }

      setAnswerLocation(payload.answerLocation ?? null);
      setGeoResults((current) => {
        const next = { ...current };
        for (const result of payload.results ?? []) {
          next[result.playerId] = { location: result.location, distanceKm: result.distanceKm };
        }
        return next;
      });
      setKmValues((current) => {
        const next = { ...current };
        for (const result of payload.results ?? []) {
          if (typeof result.distanceKm === "number") {
            next[result.playerId] = String(result.distanceKm);
          }
        }
        return next;
      });
      setStatusValues((current) => {
        const next = { ...current };
        for (const result of payload.results ?? []) {
          if (typeof result.distanceKm === "number") {
            next[result.playerId] = "deltatt";
          }
        }
        return next;
      });
      setDistanceSources((current) => {
        const next = { ...current };
        for (const result of payload.results ?? []) {
          if (typeof result.distanceKm === "number") {
            next[result.playerId] = "auto";
          }
        }
        return next;
      });
    });
  }

  return (
    <form action={saveRoundAction} className="space-y-5">
      <input type="hidden" name="id" value={round.id} />
      <input name="answer_location_json" type="hidden" value={answerLocation ? JSON.stringify(answerLocation) : ""} />
      <div className="grid gap-4 lg:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Dato</span>
          <input
            name="date"
            type="date"
            defaultValue={round.date}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Rundenavn</span>
          <input
            name="name"
            defaultValue={round.name}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="F.eks. Sarajevoprøven"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Fasit / sted</span>
          <input
            name="answer"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setAnswerLocation(null);
              setGeoResults((current) =>
                Object.fromEntries(
                  Object.entries(current).map(([playerId, preview]) => [
                    playerId,
                    { ...preview, distanceKm: null },
                  ]),
                ),
              );
              setDistanceSources((current) =>
                Object.fromEntries(Object.keys(current).map((playerId) => [playerId, ""])),
              );
            }}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="Riktig sted"
          />
          {answerLocation ? (
            <span className="flex items-start gap-1 text-xs leading-5 text-[#285c45]">
              <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
              {locationText(answerLocation)}
            </span>
          ) : null}
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Land</span>
          <input
            name="country"
            defaultValue={round.country}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Kontinent</span>
          <input
            name="continent"
            defaultValue={round.continent}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
          />
        </label>
        <label className="space-y-2 lg:col-span-1">
          <span className="text-sm font-semibold text-[#273125]">Kommentar</span>
          <input
            name="comment"
            defaultValue={round.comment}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="Kort hendelse til annalene"
          />
        </label>
      </div>

      <div className="rounded border border-[#d8ded0] bg-[#f7f8f5] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-[#203c62]">Auto-kilometer</p>
            <p className="mt-1 text-sm leading-6 text-[#5b6257]">
              Skriv fasit og svarene slik de ble gitt, trykk beregn, og juster manuelt hvis karttreffet trenger GeoVAR.
            </p>
          </div>
          <button
            type="button"
            onClick={calculateDistances}
            disabled={isPending}
            className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#285c45] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#214b38] disabled:cursor-wait disabled:opacity-70"
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Calculator className="h-4 w-4" aria-hidden="true" />}
            Beregn avstander
          </button>
        </div>
        {error ? (
          <p className="mt-3 rounded border border-[#8e3030]/25 bg-[#8e3030]/8 px-3 py-2 text-sm font-semibold text-[#8e3030]">
            {error}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded border border-[#d8ded0]">
        <table className="w-full min-w-[1160px] text-left text-sm">
          <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
            <tr>
              <th className="px-3 py-3">Geot</th>
              <th className="px-3 py-3">Svar</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Km fra fasit</th>
              <th className="px-3 py-3">Poeng</th>
              <th className="px-3 py-3">Tellende kattometer</th>
              <th className="px-3 py-3">Merknad</th>
            </tr>
          </thead>
          <tbody>
            {competingPlayers.map((player) => {
              const result = resultFor(round, player.id);
              const computedResult = computed.results.find((candidate) => candidate.player.id === player.id);
              const preview = geoResults[player.id];

              return (
                <tr key={player.id} className="border-b border-[#eef1eb] last:border-b-0">
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm" style={{ background: player.color }} />
                      <div>
                        <p className="font-semibold text-[#161713]">{player.shortName}</p>
                        <p className="text-xs text-[#5b6257]">{player.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      name={`guess_text_${player.id}`}
                      value={guessTexts[player.id] ?? ""}
                      onChange={(event) => {
                        const nextText = event.target.value;
                        setGuessTexts((current) => ({ ...current, [player.id]: nextText }));
                        setGeoResults((current) => ({ ...current, [player.id]: { location: null, distanceKm: null } }));
                        setKmValues((current) => ({ ...current, [player.id]: "" }));
                        setDistanceSources((current) => ({ ...current, [player.id]: "" }));
                      }}
                      className="h-10 w-64 rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
                      placeholder="Svaret geoten ga"
                    />
                    <input
                      name={`guess_location_json_${player.id}`}
                      type="hidden"
                      value={preview?.location ? JSON.stringify(preview.location) : ""}
                    />
                    <input name={`auto_km_${player.id}`} type="hidden" value={preview?.distanceKm ?? ""} />
                    <input name={`distance_source_${player.id}`} type="hidden" value={distanceSources[player.id] ?? ""} />
                    {preview?.location ? (
                      <p className="mt-1 max-w-64 text-xs leading-5 text-[#285c45]">{locationText(preview.location)}</p>
                    ) : guessTexts[player.id]?.trim() ? (
                      <p className="mt-1 max-w-64 text-xs leading-5 text-[#8e3030]">Ikke beregnet ennå</p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <select
                      name={`status_${player.id}`}
                      value={statusValues[player.id] ?? "ikke_deltatt"}
                      onChange={(event) => setStatusValues((current) => ({ ...current, [player.id]: event.target.value as ResultStatus }))}
                      className="h-10 w-full rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      name={`km_${player.id}`}
                      type="number"
                      step="0.1"
                      min="0"
                      value={kmValues[player.id] ?? ""}
                      onChange={(event) => {
                        setKmValues((current) => ({ ...current, [player.id]: event.target.value }));
                        setDistanceSources((current) => ({ ...current, [player.id]: "manual" }));
                      }}
                      className="h-10 w-32 rounded border border-[#d8ded0] bg-white px-2 text-right outline-none focus:border-[#203c62]"
                      placeholder="0"
                    />
                    <p className="mt-1 text-xs text-[#5b6257]">
                      {distanceSources[player.id] === "auto" ? "Auto" : distanceSources[player.id] === "manual" ? "Manuell" : "Ikke satt"}
                    </p>
                  </td>
                  <td className="px-3 py-3 font-mono text-[#203c62]">{computedResult?.points ?? 0}</td>
                  <td className="px-3 py-3">
                    <span className={computedResult?.chargedReason === "kattometerstraff" ? "font-semibold text-[#8e3030]" : ""}>
                      {formatKm(computedResult?.chargedKm)}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <input
                      name={`note_${player.id}`}
                      defaultValue={result?.note ?? ""}
                      className="h-10 w-full rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
                      placeholder="Kort protokollmerknad"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded border border-[#d8ded0] bg-[#f7f8f5] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[#5b6257]">
          <ShieldCheck className="h-4 w-4 text-[#285c45]" aria-hidden="true" />
          <span>
            {computed.participantCount} gyldige deltakere · maks {computed.maxPoints} poeng · kattometerstraff:{" "}
            <strong className="text-[#161713]">{formatKm(computed.worstThreeAverage)}</strong>
          </span>
        </div>
        <button
          type="submit"
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Lagre protokoll
        </button>
      </div>
    </form>
  );
}
