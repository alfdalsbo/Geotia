import { Save, ShieldCheck } from "lucide-react";

import { saveRoundAction } from "@/app/actions";
import { computeRound } from "@/lib/scoring";
import { competingPlayers } from "@/lib/seed";
import type { Round } from "@/lib/types";
import { formatKm } from "@/lib/utils";

const statusOptions = [
  { value: "deltatt", label: "Deltatt" },
  { value: "ikke_deltatt", label: "Desertering" },
  { value: "ugyldig", label: "Ugyldig" },
];

export function RoundForm({ round }: { round: Round }) {
  const computed = computeRound(round, competingPlayers);

  return (
    <form action={saveRoundAction} className="space-y-5">
      <input type="hidden" name="id" value={round.id} />
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
            defaultValue={round.answer}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="Riktig sted"
          />
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

      <div className="overflow-x-auto rounded border border-[#d8ded0]">
        <table className="w-full min-w-[960px] text-left text-sm">
          <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
            <tr>
              <th className="px-3 py-3">Geot</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Km fra fasit</th>
              <th className="px-3 py-3">Poeng</th>
              <th className="px-3 py-3">Tellende kattometer</th>
              <th className="px-3 py-3">Merknad</th>
            </tr>
          </thead>
          <tbody>
            {competingPlayers.map((player) => {
              const result =
                round.results.find((candidate) => candidate.playerId === player.id) ??
                computed.results.find((candidate) => candidate.player.id === player.id);
              const computedResult = computed.results.find((candidate) => candidate.player.id === player.id);

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
                    <select
                      name={`status_${player.id}`}
                      defaultValue={result?.status ?? "ikke_deltatt"}
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
                      defaultValue={result?.actualKm ?? ""}
                      className="h-10 w-32 rounded border border-[#d8ded0] bg-white px-2 text-right outline-none focus:border-[#203c62]"
                      placeholder="0"
                    />
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
            {computed.participantCount} gyldige deltakere · kattometerstraff:{" "}
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
