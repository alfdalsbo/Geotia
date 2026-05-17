import { Gamepad2, Save } from "lucide-react";

import { saveGameSessionAction } from "@/app/actions";
import { PendingSubmitButton } from "@/components/pending-submit-button";
import { competingPlayers, games } from "@/lib/seed";
import type { GameSession } from "@/lib/types";

const scoreGames = games.filter((game) => game.id !== "slowgeo");

const statusOptions = [
  { value: "deltatt", label: "Deltatt" },
  { value: "ikke_deltatt", label: "Desertering" },
  { value: "ugyldig", label: "Ugyldig" },
];

export function GameSessionForm({ session }: { session: GameSession }) {
  return (
    <form action={saveGameSessionAction} className="space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Spill</span>
          <select
            name="gameId"
            defaultValue={session.gameId === "slowgeo" ? "geo" : session.gameId}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
          >
            {scoreGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Dato</span>
          <input
            name="date"
            type="date"
            defaultValue={session.date}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Navn på økt</span>
          <input
            name="title"
            defaultValue={session.title}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="F.eks. Globle ved kveldsmat"
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-[#273125]">Kontekst</span>
          <input
            name="context"
            defaultValue={session.context}
            className="h-11 w-full rounded border border-[#d8ded0] bg-white px-3 outline-none focus:border-[#203c62]"
            placeholder="Fysisk, digitalt, daglig, kaos"
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded border border-[#d8ded0]">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
            <tr>
              <th className="px-3 py-3">Geot</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Score / forsøk</th>
              <th className="px-3 py-3">Merknad</th>
            </tr>
          </thead>
          <tbody>
            {competingPlayers.map((player) => {
              const result = session.results.find((candidate) => candidate.playerId === player.id);
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
                      name={`score_${player.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={result?.score ?? ""}
                      className="h-10 w-36 rounded border border-[#d8ded0] bg-white px-2 text-right outline-none focus:border-[#203c62]"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-3 py-3">
                    <input
                      name={`note_${player.id}`}
                      defaultValue={result?.note ?? ""}
                      className="h-10 w-full rounded border border-[#d8ded0] bg-white px-2 outline-none focus:border-[#203c62]"
                      placeholder="Kort krønike"
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
          <Gamepad2 className="h-4 w-4 text-[#7c2430]" aria-hidden="true" />
          <span>Geo/MapTap bruker høy score. Satle/Globle bruker færrest forsøk.</span>
        </div>
        <PendingSubmitButton
          className="inline-flex h-11 items-center justify-center gap-2 rounded bg-[#203c62] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#172d4b]"
        >
          <Save className="h-4 w-4" aria-hidden="true" />
          Før spilløkt
        </PendingSubmitButton>
      </div>
    </form>
  );
}
