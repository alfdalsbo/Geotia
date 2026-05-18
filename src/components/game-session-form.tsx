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
    <form action={saveGameSessionAction} className="geo-form space-y-5">
      <div className="grid gap-4 lg:grid-cols-4">
        <label>
          <span>Spill</span>
          <select name="gameId" defaultValue={session.gameId === "slowgeo" ? "geo" : session.gameId}>
            {scoreGames.map((game) => (
              <option key={game.id} value={game.id}>
                {game.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Dato</span>
          <input name="date" type="date" defaultValue={session.date} required />
        </label>
        <label>
          <span>Navn på økt</span>
          <input
            name="title"
            defaultValue={session.title}
            placeholder="F.eks. Globle ved kveldsmat"
            required
          />
        </label>
        <label>
          <span>Kontekst</span>
          <input
            name="context"
            defaultValue={session.context}
            placeholder="Fysisk, digitalt, daglig, kaos"
          />
        </label>
      </div>

      <div className="responsive-protocol-wrap overflow-x-auto">
        <table className="protocol responsive-protocol w-full min-w-[900px]">
          <thead>
            <tr>
              <th>Geot</th>
              <th>Status</th>
              <th className="right">Score / forsøk</th>
              <th>Merknad</th>
            </tr>
          </thead>
          <tbody>
            {competingPlayers.map((player) => {
              const result = session.results.find((candidate) => candidate.playerId === player.id);
              return (
                <tr key={player.id}>
                  <td data-label="Geot">
                    <div className="geot-cell">
                      <span className="geot-flag" style={{ background: player.color }} />
                      <div className="min-w-0">
                        <div className="geot-name">{player.shortName}</div>
                        <div className="geot-title">{player.title}</div>
                      </div>
                    </div>
                  </td>
                  <td data-label="Status">
                    <select name={`status_${player.id}`} defaultValue={result?.status ?? "ikke_deltatt"}>
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="right" data-label="Score / forsøk">
                    <input
                      name={`score_${player.id}`}
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={result?.score ?? ""}
                      className="w-36 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td data-label="Merknad">
                    <input
                      name={`note_${player.id}`}
                      defaultValue={result?.note ?? ""}
                      placeholder="Kort krønike"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 rounded border border-[#c49a3c]/45 bg-[#fff7e6] p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-[#4f412b]">
          <Gamepad2 className="h-4 w-4 text-[#7c2430]" aria-hidden="true" />
          <span>Geo/MapTap bruker høy score. Satle/Globle bruker færrest forsøk.</span>
        </div>
        <PendingSubmitButton className="btn btn-wax">
          <Save className="h-4 w-4" aria-hidden="true" />
          Før spilløkt
        </PendingSubmitButton>
      </div>
    </form>
  );
}
