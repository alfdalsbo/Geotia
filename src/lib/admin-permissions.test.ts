import { describe, expect, it } from "vitest";

import {
  canManageGameSessions,
  canManageRounds,
  canManageSlowGeoAdmin,
  canStartSlowGeoRound,
} from "@/lib/admin-permissions";

describe("admin permissions", () => {
  it("lets only Third College manage rounds, game sessions, and SlowGeo admin", () => {
    expect(canManageRounds("alf")).toBe(true);
    expect(canManageGameSessions("steinar")).toBe(true);
    expect(canManageSlowGeoAdmin("vegard")).toBe(true);

    expect(canManageRounds("jorgen")).toBe(false);
    expect(canManageGameSessions("ruben")).toBe(false);
    expect(canManageSlowGeoAdmin("danny")).toBe(false);
    expect(canManageRounds(null)).toBe(false);
  });

  it("lets ordinary geots start SlowGeo without giving them SlowGeo admin rights", () => {
    expect(canStartSlowGeoRound("ruben")).toBe(true);
    expect(canStartSlowGeoRound("jorgen")).toBe(true);
    expect(canStartSlowGeoRound("alf")).toBe(true);

    expect(canStartSlowGeoRound("danny")).toBe(false);
    expect(canManageSlowGeoAdmin("ruben")).toBe(false);
  });
});
