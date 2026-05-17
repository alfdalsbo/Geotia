import { describe, expect, it } from "vitest";

import {
  buildOpenSlowGeoShareText,
  buildOpenSlowGeoShareTextOptions,
  buildPersonalRevealedSlowGeoShareTextOptions,
  buildRevealedSlowGeoShareText,
  buildRevealedSlowGeoShareTextOptions,
  isSafeSlowGeoAttribution,
} from "@/lib/slowgeo-share";

describe("SlowGeo sharing and attribution helpers", () => {
  it("builds stable thread text for open rounds", () => {
    const first = buildOpenSlowGeoShareText("Kveldens bilde");
    const second = buildOpenSlowGeoShareText("Kveldens bilde");

    expect(first).toBe(second);
    expect(first).toContain("Kveldens bilde");
    expect(first.length).toBeGreaterThan(20);
  });

  it("builds selectable open thread text without empty options", () => {
    const options = buildOpenSlowGeoShareTextOptions("Kveldens bilde", "round-42");

    expect(options).toHaveLength(4);
    expect(new Set(options).size).toBe(options.length);
    expect(options.every((option) => option.includes("Kveldens bilde"))).toBe(true);
    expect(options.every((option) => option.trim().length > 0)).toBe(true);
  });

  it("builds stable reveal text with winners", () => {
    const text = buildRevealedSlowGeoShareText({
      roundName: "Kveldens bilde",
      answerLabel: "Tromsø",
      winnerNames: ["Alf", "Vegard"],
      seed: "round-42",
    });

    expect(text).toContain("Kveldens bilde");
    expect(text).toContain("Tromsø");
    expect(text).toContain("Vinner: Alf, Vegard.");
  });

  it("builds reveal and personal reveal option banks", () => {
    const revealOptions = buildRevealedSlowGeoShareTextOptions({
      roundName: "Kveldens bilde",
      answerLabel: "Tromsø",
      winnerNames: ["Alf"],
      seed: "round-42",
    });
    const personalOptions = buildPersonalRevealedSlowGeoShareTextOptions({
      roundName: "Kveldens bilde",
      answerLabel: "Tromsø",
      playerName: "Danny",
      distance: "12 km",
      winnerNames: ["Alf"],
      seed: "round-42:danny",
    });

    expect(revealOptions).toHaveLength(4);
    expect(personalOptions).toHaveLength(4);
    expect(revealOptions.every((option) => option.includes("Tromsø"))).toBe(true);
    expect(personalOptions.every((option) => option.includes("Danny") && option.includes("12 km"))).toBe(true);
  });

  it("allows generic Google attribution and rejects revealing names", () => {
    expect(isSafeSlowGeoAttribution("© 2024 Google")).toBe(true);
    expect(isSafeSlowGeoAttribution("© Google Street View")).toBe(true);
    expect(isSafeSlowGeoAttribution("© Mari")).toBe(false);
    expect(isSafeSlowGeoAttribution("© 2024 Google / Mari")).toBe(false);
  });
});
