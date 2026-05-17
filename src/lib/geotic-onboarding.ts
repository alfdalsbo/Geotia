import { partyTrials } from "@/lib/geotisk-orden";

type OnboardingRow = {
  player: {
    partyId?: string | null;
    role?: string;
  };
  rank: {
    number: number;
  };
  roundsPlayed: number;
  sponsor: string;
  trial: string;
};

export type OnboardingStepStatus = "done" | "current" | "locked";

export type OnboardingStep = {
  id: "rounds" | "code" | "sponsor" | "trial";
  title: string;
  detail: string;
  status: OnboardingStepStatus;
  progress: number;
};

function trialForParty(partyId?: string | null) {
  if (!partyId) return partyTrials[0];
  const prefix = `${partyId.toUpperCase()}-prøven`;
  return partyTrials.find((trial) => trial.startsWith(prefix)) ?? partyTrials[0];
}

export function getGeoticOnboardingPath(row: OnboardingRow) {
  const roundsProgress = Math.min(row.roundsPlayed, 3);
  const roundsDone = roundsProgress >= 3;
  const codeDone = row.rank.number >= 2 || roundsDone;
  const sponsorDone =
    Boolean(row.sponsor.trim()) ||
    (row.rank.number >= 3 && Boolean(row.player.partyId) && row.player.role !== "tingvitne");
  const trialDone = Boolean(row.trial.trim()) || row.rank.number >= 4;
  const rawSteps: Array<Omit<OnboardingStep, "status"> & { done: boolean }> = [
    {
      id: "rounds",
      title: "Tre prøverunder",
      detail: `${roundsProgress}/3 runder ført i protokollen.`,
      progress: Math.round((roundsProgress / 3) * 100),
      done: roundsDone,
    },
    {
      id: "code",
      title: "GeoKodeksen",
      detail: codeDone ? "Grunnteksten er sosialt akseptert." : "Les kodeksen før selvtilliten får uniform.",
      progress: codeDone ? 100 : 0,
      done: codeDone,
    },
    {
      id: "sponsor",
      title: "Sponsor",
      detail: sponsorDone ? row.sponsor || `${row.player.partyId?.toUpperCase()} bærer ansvaret.` : "Må ha en geot eller et parti som tør å stå nær.",
      progress: sponsorDone ? 100 : 0,
      done: sponsorDone,
    },
    {
      id: "trial",
      title: "Partiprøve",
      detail: trialDone ? row.trial || "Prøven regnes som bestått." : trialForParty(row.player.partyId),
      progress: trialDone ? 100 : 0,
      done: trialDone,
    },
  ];

  const firstOpenIndex = rawSteps.findIndex((step) => !step.done);
  const steps = rawSteps.map(({ done, ...step }, index): OnboardingStep => ({
    ...step,
    status: done ? "done" : index === firstOpenIndex ? "current" : "locked",
  }));

  return {
    steps,
    completed: steps.filter((step) => step.status === "done").length,
    total: steps.length,
    progress: Math.round((steps.filter((step) => step.status === "done").length / steps.length) * 100),
    nextStep: steps.find((step) => step.status === "current") ?? null,
    recommendedTrial: trialForParty(row.player.partyId),
  };
}
