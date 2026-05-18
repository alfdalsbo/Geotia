import { GeotingMiniCountdown } from "@/components/geoting-countdown";
import { LiveBar, type LiveBarItem } from "@/components/ui/live-bar";
import { competingPlayers } from "@/lib/seed";
import { getSlowGeoProgress, slowGeoDifficultyLabels } from "@/lib/slowgeo-insights";
import type { Round } from "@/lib/types";

export function SlowGeoGlobalAlert({ rounds }: { rounds: Round[] }) {
  const active = rounds.filter((round) => round.status === "open" && round.challenge && round.deadlineAt);
  const primary = active[0];
  if (!primary) return null;

  const progress = getSlowGeoProgress(primary);
  const missingNames = competingPlayers
    .filter((player) => {
      const result = primary.results.find((candidate) => candidate.playerId === player.id);
      return !result?.guessLocation;
    })
    .map((player) => player.shortName);
  const difficulty = primary.challenge?.difficulty ? slowGeoDifficultyLabels[primary.challenge.difficulty] : null;

  const caseCode = `RUNDE · ${primary.number}`;
  const titleSuffix = active.length > 1 ? ` + ${active.length - 1} til` : "";
  const meta = [
    `${progress.submittedCount}/${progress.totalCount} pin-svar låst`,
    difficulty,
    missingNames.length ? `mangler ${missingNames.slice(0, 3).join(", ")}${missingNames.length > 3 ? " …" : ""}` : "alle inne",
  ]
    .filter(Boolean)
    .join(" · ");

  const item: LiveBarItem = {
    tag: `SlowGeo pågår nå · ${meta}`,
    caseCode,
    title: `${primary.name}${titleSuffix}`,
    deadlineLabel: <GeotingMiniCountdown endsAt={primary.deadlineAt} />,
    actionHref: `/runder/${primary.id}`,
    actionLabel: "Gå til SlowGeo →",
  };

  return <LiveBar item={item} />;
}
