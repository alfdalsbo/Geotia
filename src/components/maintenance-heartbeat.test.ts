// @vitest-environment jsdom

import React, { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MaintenanceHeartbeat } from "@/components/maintenance-heartbeat";

function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    value: state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

function renderHeartbeat() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(React.createElement(MaintenanceHeartbeat));
  });
  return { container, root };
}

function cleanup(root: Root, container: HTMLElement) {
  act(() => {
    root.unmount();
  });
  container.remove();
}

describe("maintenance heartbeat", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response()));
    setVisibility("hidden");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    document.body.innerHTML = "";
  });

  it("only checks while the Geotia tab is visible", async () => {
    const { container, root } = renderHeartbeat();
    const fetchMock = vi.mocked(fetch);

    expect(fetchMock).not.toHaveBeenCalled();

    act(() => {
      setVisibility("visible");
    });
    expect(fetchMock).toHaveBeenCalledOnce();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5 * 60 * 1000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    act(() => {
      setVisibility("hidden");
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(10 * 60 * 1000);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    cleanup(root, container);
  });
});
