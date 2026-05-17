import { describe, expect, it } from "vitest";

import { getPartyMechanic, partyMechanics } from "@/lib/party-mechanics";

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
});
