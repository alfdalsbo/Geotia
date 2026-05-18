import { Crown, Medal, TrendingDown, TrendingUp } from "lucide-react";

import { Section, StatTile } from "@/components/section";
import { computeStandings } from "@/lib/scoring";
import { getRoundsState } from "@/lib/store";
import { formatKm, formatNumber } from "@/lib/utils";

export const metadata = {
  title: "SlowGeo-tabell",
};

export default async function StandingsPage() {
  const state = await getRoundsState();
  const standings = computeStandings(state.players, state.rounds);
  const leader = standings[0];
  const kattometerLeader = standings
    .filter((standing) => standing.lockedRounds > 0)
    .sort((a, b) => a.totalKattometer - b.totalKattometer)[0];
  const skam = [...standings].sort((a, b) => b.totalKattometer - a.totalKattometer)[0];

  return (
    <div className="space-y-6">
      <div className="geotia-frame rounded p-5 sm:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#7c2430]">
          SlowGeo-register
        </p>
        <h1 className="font-display mt-2 text-4xl font-semibold tracking-normal text-[#062b40] sm:text-5xl">
          SlowGeo-tabell
        </h1>
        <p className="mt-3 max-w-3xl text-[#60553f]">
          SlowGeo-tabellen sorteres etter poeng, deretter lavest kattometer og flest seire.
          Slik holdes både ære og avstand i samme statlige hånd.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <StatTile
          label="Regent etter poeng"
          value={leader?.player.shortName ?? "-"}
          detail={`${leader?.totalPoints ?? 0} poeng`}
          tone="blue"
        />
        <StatTile
          label="Lavest kattometer"
          value={kattometerLeader?.player.shortName ?? "-"}
          detail={formatKm(kattometerLeader?.totalKattometer)}
          tone="green"
        />
        <StatTile
          label="Skammens tyngdepunkt"
          value={skam?.player.shortName ?? "-"}
          detail={formatKm(skam?.totalKattometer)}
          tone="red"
        />
      </div>

      <Section title="Rangert tabell" eyebrow="Offisiell poenglov">
        <div className="grid gap-3 md:hidden">
          {standings.map((standing) => (
            <article key={standing.player.id} className="rounded border border-[#d8ded0] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8e3030]">#{standing.rank}</p>
                  <h2 className="font-display mt-1 text-2xl font-semibold text-[#062b40]">{standing.player.shortName}</h2>
                  <p className="mt-1 text-sm text-[#5b6257]">{standing.player.title}</p>
                </div>
                <span className="h-11 w-2 flex-none rounded-full" style={{ background: standing.player.color }} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <MobileMetric label="Poeng" value={standing.totalPoints} />
                <MobileMetric label="Kattometer" value={formatKm(standing.totalKattometer)} />
                <MobileMetric label="Runder" value={standing.roundsPlayed} />
                <MobileMetric label="Seire" value={standing.wins} />
              </div>
            </article>
          ))}
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1120px] text-left text-sm">
            <thead className="bg-[#203c62] text-xs uppercase tracking-[0.12em] text-white">
              <tr>
                <th className="px-3 py-3">Rang</th>
                <th className="px-3 py-3">Geot</th>
                <th className="px-3 py-3 text-right">Poeng</th>
                <th className="px-3 py-3 text-right">Kattometer</th>
                <th className="px-3 py-3 text-right">Runder spilt</th>
                <th className="px-3 py-3 text-right">Seire</th>
                <th className="px-3 py-3 text-right">Topp 3</th>
                <th className="px-3 py-3 text-right">Sisteplasser</th>
                <th className="px-3 py-3 text-right">Deserteringer</th>
                <th className="px-3 py-3 text-right">Snitt p</th>
                <th className="px-3 py-3 text-right">Snitt km</th>
                <th className="px-3 py-3 text-right">Beste km</th>
                <th className="px-3 py-3 text-right">Verste km</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((standing) => (
                <tr key={standing.player.id} className="border-b border-[#eef1eb] bg-white last:border-b-0">
                  <td className="px-3 py-3 font-mono text-[#8e3030]">{standing.rank}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-8 w-1 rounded-full"
                        style={{ background: standing.player.color }}
                      />
                      <div>
                        <p className="font-semibold text-[#161713]">{standing.player.shortName}</p>
                        <p className="text-xs text-[#5b6257]">{standing.player.title}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-semibold">{standing.totalPoints}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.totalKattometer)}</td>
                  <td className="px-3 py-3 text-right">{standing.roundsPlayed}</td>
                  <td className="px-3 py-3 text-right">{standing.wins}</td>
                  <td className="px-3 py-3 text-right">{standing.top3}</td>
                  <td className="px-3 py-3 text-right">{standing.lastPlaces}</td>
                  <td className="px-3 py-3 text-right">{standing.absences}</td>
                  <td className="px-3 py-3 text-right">{formatNumber(standing.averagePoints)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.averageKattometer)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.bestKm)}</td>
                  <td className="px-3 py-3 text-right">{formatKm(standing.worstKm)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Section title="Poengmakt" eyebrow="Toppfelt">
          <div className="space-y-3">
            {standings.slice(0, 3).map((standing) => (
              <div key={standing.player.id} className="flex items-center justify-between rounded border border-[#d8ded0] bg-white p-3">
                <span className="flex items-center gap-2 font-semibold">
                  <Crown className="h-4 w-4 text-[#b8892f]" aria-hidden="true" />
                  {standing.player.shortName}
                </span>
                <span>{standing.totalPoints} p</span>
              </div>
            ))}
          </div>
        </Section>
        <Section title="Presisjon" eyebrow="Kattometer">
          <div className="space-y-3">
            {[...standings]
              .filter((standing) => standing.lockedRounds > 0)
              .sort((a, b) => a.totalKattometer - b.totalKattometer)
              .slice(0, 3)
              .map((standing) => (
                <div key={standing.player.id} className="flex items-center justify-between rounded border border-[#d8ded0] bg-white p-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <TrendingDown className="h-4 w-4 text-[#285c45]" aria-hidden="true" />
                    {standing.player.shortName}
                  </span>
                  <span>{formatKm(standing.totalKattometer)}</span>
                </div>
              ))}
          </div>
        </Section>
        <Section title="Rundeseire" eyebrow="Kampvinnere">
          <div className="space-y-3">
            {[...standings]
              .sort((a, b) => b.wins - a.wins || b.totalPoints - a.totalPoints)
              .slice(0, 3)
              .map((standing) => (
                <div key={standing.player.id} className="flex items-center justify-between rounded border border-[#d8ded0] bg-white p-3">
                  <span className="flex items-center gap-2 font-semibold">
                    <Medal className="h-4 w-4 text-[#8e3030]" aria-hidden="true" />
                    {standing.player.shortName}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" aria-hidden="true" />
                    {standing.wins}
                  </span>
                </div>
              ))}
          </div>
        </Section>
      </div>
    </div>
  );
}

function MobileMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="mobile-metric rounded border border-[#d8c48c] bg-[#fff7e6] p-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7c2430]">{label}</p>
      <p className="mobile-metric-value mt-1 font-semibold text-[#062b40]">{value}</p>
    </div>
  );
}
