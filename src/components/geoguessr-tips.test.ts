// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GeoGuessrTipCard } from "@/components/geo-guessr-tip-card";
import { GeoGuessrTipToast } from "@/components/geo-guessr-tip-toast";
import { SlowGeoTipPanel } from "@/components/slowgeo-tip-panel";
import type { GeoGuessrTip } from "@/lib/geoguessr-tips";

const tip: GeoGuessrTip = {
  id: "test-tip",
  title: "Nederland: gule plater",
  body: "Gule bilskilt både foran og bak peker sterkt mot Nederland.",
  category: "license-plates",
  countries: ["Nederland"],
  regions: ["Vest-Europa"],
  difficulty: "basic",
  confidence: "high",
  tags: ["nederland", "gule-plater"],
  sourceRefs: ["geometas-license-plates"],
};

function render(element: React.ReactElement) {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(element);
  });
  return { container, root };
}

function cleanup(root: Root, container: HTMLElement) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

describe("GeoGuessr tip components", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-17T10:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    window.localStorage.clear();
    document.body.innerHTML = "";
  });

  it("renders a tip card with title, body and country", () => {
    const { container, root } = render(React.createElement(GeoGuessrTipCard, { tip }));

    expect(container.textContent).toContain("Nederland: gule plater");
    expect(container.textContent).toContain("Gule bilskilt");
    expect(container.textContent).toContain("Nederland");

    cleanup(root, container);
  });

  it("shows the toast after delay and stores the daily limit state", async () => {
    const storageKey = "test-tip-toast";
    const { container, root } = render(
      React.createElement(GeoGuessrTipToast, {
        tips: [tip],
        delayMs: 10,
        cooldownMs: 1000,
        maxPerDay: 3,
        storageKey,
      }),
    );

    expect(container.textContent).not.toContain("Nederland: gule plater");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12);
    });

    expect(container.textContent).toContain("Nederland: gule plater");
    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}")).toMatchObject({
      count: 1,
      seenIds: ["test-tip"],
    });

    cleanup(root, container);
  });

  it("keeps the toast hidden during cooldown", async () => {
    const storageKey = "test-tip-toast-cooldown";
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        date: "2026-05-17",
        count: 1,
        lastShownAt: Date.now(),
        seenIds: ["test-tip"],
      }),
    );
    const { container, root } = render(
      React.createElement(GeoGuessrTipToast, {
        tips: [tip],
        delayMs: 10,
        cooldownMs: 1000,
        maxPerDay: 3,
        storageKey,
      }),
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(12);
    });

    expect(container.textContent).not.toContain("Nederland: gule plater");

    cleanup(root, container);
  });

  it("shows SlowGeo tips without requiring interaction", () => {
    const { container, root } = render(React.createElement(SlowGeoTipPanel, { tips: [tip] }));

    expect(container.textContent).toContain("Tegnlære for kranglingen");
    expect(container.textContent).toContain("Nederland: gule plater");

    cleanup(root, container);
  });
});
