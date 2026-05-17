import { describe, expect, it } from "vitest";

import {
  buildOpenSlowGeoShareText,
  buildRevealedSlowGeoShareText,
  isSafeSlowGeoAttribution,
} from "@/lib/slowgeo-share";

describe("SlowGeo sharing and attribution helpers", () => {
  it("builds stable thread text for open rounds", () => {
    expect(buildOpenSlowGeoShareText("Kveldens bilde")).toBe(
      "Nytt SlowGeo-bilde er oppe: Kveldens bilde. Krangle først, sett pinnen etterpå.",
    );
  });

  it("builds stable reveal text with winners", () => {
    expect(
      buildRevealedSlowGeoShareText({
        roundName: "Kveldens bilde",
        answerLabel: "Tromsø",
        winnerNames: ["Alf", "Vegard"],
      }),
    ).toBe("Fasit er avslørt i Kveldens bilde: Tromsø. Vinner: Alf, Vegard.");
  });

  it("allows generic Google attribution and rejects revealing names", () => {
    expect(isSafeSlowGeoAttribution("© 2024 Google")).toBe(true);
    expect(isSafeSlowGeoAttribution("© Google Street View")).toBe(true);
    expect(isSafeSlowGeoAttribution("© Mari")).toBe(false);
    expect(isSafeSlowGeoAttribution("© 2024 Google / Mari")).toBe(false);
  });
});
