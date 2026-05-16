import { describe, expect, it } from "vitest";

import {
  getThirdCollegeMembers,
  getThirdCollegeSeat,
  isThirdCollegeMember,
  thirdCollegeSeats,
} from "@/lib/kollegium";
import { players } from "@/lib/seed";

describe("Tredje Kollegium", () => {
  it("recognizes only Alf Kåre, Steinar and Vegard as members", () => {
    expect(thirdCollegeSeats.map((seat) => seat.playerId)).toEqual(["alf", "steinar", "vegard"]);
    expect(isThirdCollegeMember("alf")).toBe(true);
    expect(isThirdCollegeMember("steinar")).toBe(true);
    expect(isThirdCollegeMember("vegard")).toBe(true);
    expect(isThirdCollegeMember("jorgen")).toBe(false);
    expect(isThirdCollegeMember(null)).toBe(false);
  });

  it("resolves the hidden college seats from the player registry", () => {
    expect(getThirdCollegeMembers(players).map((player) => player.shortName)).toEqual([
      "Alf Kåre",
      "Steinar",
      "Vegard",
    ]);
    expect(getThirdCollegeSeat("steinar")?.partyId).toBe("pkk");
  });
});
