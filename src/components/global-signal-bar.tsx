"use client";

import { usePathname } from "next/navigation";

import { GeotingMiniCountdown } from "@/components/geoting-countdown";
import { LiveBar, type LiveBarItem } from "@/components/ui/live-bar";
import { competingPlayers } from "@/lib/seed";
import { getRouteContext, type RouteAreaId } from "@/lib/route-context";
import { getSlowGeoProgress, slowGeoDifficultyLabels } from "@/lib/slowgeo-insights";
import type { GeotingProposal, Round } from "@/lib/types";

type Signal = {
  area: RouteAreaId;
  item: LiveBarItem;
};

export function GlobalSignalBar({
  proposals,
  rounds,
}: {
  proposals: GeotingProposal[];
  rounds: Round[];
}) {
  const pathname = usePathname();
  const context = getRouteContext(pathname);
  const signals = [buildSlowGeoSignal(rounds), buildGeotingSignal(proposals)].filter(Boolean) as Signal[];

  if (!signals.length) return null;

  const awaySignals = signals.filter((signal) => signal.area !== context.primary.id);
  if (awaySignals.length) {
    const item = signals.length > 1 ? buildCombinedSignal(awaySignals[0], signals.length) : awaySignals[0].item;
    return <LiveBar item={item} />;
  }

  return <LiveBar item={signals[0].item} variant="compact" />;
}

function buildGeotingSignal(proposals: GeotingProposal[]): Signal | null {
  const active = proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
  const primary = active[0];
  if (!primary) return null;

  const caseCode = `SAK · ${primary.id.slice(-4).toUpperCase()}`;
  const titleSuffix = active.length > 1 ? ` + ${active.length - 1} til` : "";

  return {
    area: "geotinget",
    item: {
      tag: "Aktiv avstemning · GeoTinget",
      caseCode,
      title: `${primary.title}${titleSuffix}`,
      deadlineLabel: <GeotingMiniCountdown endsAt={primary.voteEndsAt} />,
      actionHref: "/geotinget/avstemninger",
      actionLabel: "Gå til Stemmeurnen →",
    },
  };
}

function buildSlowGeoSignal(rounds: Round[]): Signal | null {
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
  const titleSuffix = active.length > 1 ? ` + ${active.length - 1} til` : "";
  const meta = [
    `${progress.submittedCount}/${progress.totalCount} pin-svar låst`,
    difficulty,
    missingNames.length ? `mangler ${missingNames.slice(0, 3).join(", ")}${missingNames.length > 3 ? " ... " : ""}` : "alle inne",
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    area: "slowgeo",
    item: {
      tag: `SlowGeo pågår nå · ${meta}`,
      caseCode: `RUNDE · ${primary.number}`,
      title: `${primary.name}${titleSuffix}`,
      deadlineLabel: <GeotingMiniCountdown endsAt={primary.deadlineAt} />,
      actionHref: `/runder/${primary.id}`,
      actionLabel: "Gå til SlowGeo →",
    },
  };
}

function buildCombinedSignal(primary: Signal, count: number): LiveBarItem {
  return {
    ...primary.item,
    tag: `${count} aktive signaler · ${primary.item.tag}`,
    actionLabel: "Åpne viktigste signal →",
  };
}
