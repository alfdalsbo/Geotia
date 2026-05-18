import { GeotingMiniCountdown } from "@/components/geoting-countdown";
import { LiveBar, type LiveBarItem } from "@/components/ui/live-bar";
import type { GeotingProposal } from "@/lib/types";

export function GeotingGlobalAlert({ proposals }: { proposals: GeotingProposal[] }) {
  const active = proposals.filter((proposal) => proposal.status === "voting" && proposal.voteEndsAt);
  const primary = active[0];
  if (!primary) return null;

  const caseCode = `SAK · ${primary.id.slice(-4).toUpperCase()}`;
  const titleSuffix = active.length > 1 ? ` + ${active.length - 1} til` : "";

  const item: LiveBarItem = {
    tag: "Aktiv avstemning · GeoTinget",
    caseCode,
    title: `${primary.title}${titleSuffix}`,
    deadlineLabel: <GeotingMiniCountdown endsAt={primary.voteEndsAt} />,
    actionHref: "/geotinget/avstemninger",
    actionLabel: "Gå til avstemning →",
  };

  return <LiveBar item={item} />;
}
