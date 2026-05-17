import { describe, expect, it } from "vitest";

import { getGeoticOnboardingPath } from "@/lib/geotic-onboarding";

describe("Geotic onboarding", () => {
  it("turns order data into a four-step trial path", () => {
    const path = getGeoticOnboardingPath({
      player: { partyId: "pkk" },
      rank: { number: 1 },
      roundsPlayed: 2,
      sponsor: "",
      trial: "",
    });

    expect(path.progress).toBe(0);
    expect(path.nextStep?.id).toBe("rounds");
    expect(path.steps[0]).toMatchObject({ progress: 67, status: "current" });
    expect(path.recommendedTrial).toContain("PKK-prøven");
  });

  it("recognizes party membership and recorded trials", () => {
    const path = getGeoticOnboardingPath({
      player: { partyId: "ira" },
      rank: { number: 4 },
      roundsPlayed: 18,
      sponsor: "IRA",
      trial: "IRA-prøven gjennomført",
    });

    expect(path.progress).toBe(100);
    expect(path.nextStep).toBeNull();
  });
});
