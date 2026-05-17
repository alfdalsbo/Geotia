import { describe, expect, it } from "vitest";

import { getPartyMechanic, getProposalPartyMechanics, partyMechanics } from "@/lib/party-mechanics";
import { players } from "@/lib/seed";
import type { GeotingProposal } from "@/lib/types";

describe("party mechanics", () => {
  it("keeps the phase three party powers explicit and bounded", () => {
    expect(partyMechanics.map((mechanic) => mechanic.partyId)).toEqual([
      "ss",
      "ira",
      "plo",
      "pkk",
      "cip",
      "mossad",
      "pwp",
    ]);
    expect(getPartyMechanic("ira")?.title).toBe("Konstitusjonell innsigelse");
    expect(getPartyMechanic("pkk")?.phase).toBe("krangel");
    expect(getPartyMechanic("mossad")?.title).toBe("Avslutningsforslag");
    expect(getPartyMechanic("pwp")?.title).toBe("Hastebehandling");
  });

  it("evaluates which party powers are live for a proposal", () => {
    const proposal: GeotingProposal = {
      id: "p1",
      title: "Lov om rask uro",
      body: "Dette er uklart.",
      ruleType: "grunnlov",
      proposedBy: "alf",
      status: "open",
      createdAt: "2026-05-17T10:00:00.000Z",
      updatedAt: "2026-05-17T10:00:00.000Z",
      voteStartedAt: null,
      voteEndsAt: null,
      voteStartedBy: null,
      oathText: "",
      resolvedAt: null,
      implementationStatus: "pending",
      implementationNote: "",
      implementedAt: null,
      partyPositions: [],
      votes: [],
    };

    const mechanics = getProposalPartyMechanics(proposal, players);

    expect(mechanics.find((mechanic) => mechanic.partyId === "ira")).toMatchObject({ state: "available" });
    expect(mechanics.find((mechanic) => mechanic.partyId === "pwp")).toMatchObject({ state: "waiting" });
    expect(mechanics.find((mechanic) => mechanic.partyId === "mossad")).toMatchObject({ state: "available" });
  });
});
