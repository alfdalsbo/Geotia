import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  getCachedGeocodeLocation: vi.fn(),
  setCachedGeocodeLocation: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/store", () => ({
  getCachedGeocodeLocation: mocks.getCachedGeocodeLocation,
  setCachedGeocodeLocation: mocks.setCachedGeocodeLocation,
}));

function request(payload: unknown) {
  return new Request("http://localhost/api/geocode/round-preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  mocks.getSession.mockReset();
  mocks.getCachedGeocodeLocation.mockReset();
  mocks.setCachedGeocodeLocation.mockReset();
});

describe("round preview geocoding API", () => {
  it("rejects unknown or duplicated players before external geocoding", async () => {
    mocks.getSession.mockResolvedValue({ playerId: "alf" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");

    const unknown = await POST(request({
      answer: "Bergen",
      guesses: [{ playerId: "ukjent", text: "Oslo" }],
    }));
    const duplicate = await POST(request({
      answer: "Bergen",
      guesses: [
        { playerId: "alf", text: "Oslo" },
        { playerId: "alf", text: "Trondheim" },
      ],
    }));

    expect(unknown.status).toBe(400);
    expect(duplicate.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects too many or too long guesses before external geocoding", async () => {
    mocks.getSession.mockResolvedValue({ playerId: "alf" });
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const { POST } = await import("./route");
    const tooLong = "x".repeat(181);

    const tooMany = await POST(request({
      answer: "Bergen",
      guesses: [
        { playerId: "alf", text: "Oslo" },
        { playerId: "vegard", text: "Trondheim" },
        { playerId: "jorgen", text: "Stavanger" },
        { playerId: "steinar", text: "Tromso" },
        { playerId: "sverre", text: "Molde" },
        { playerId: "fredrik", text: "Moss" },
        { playerId: "ruben", text: "Drammen" },
        { playerId: "danny", text: "Hamar" },
        { playerId: "ekstra", text: "Lillehammer" },
      ],
    }));
    const longGuess = await POST(request({
      answer: "Bergen",
      guesses: [{ playerId: "alf", text: tooLong }],
    }));

    expect(tooMany.status).toBe(400);
    expect(longGuess.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 408 when Nominatim times out", async () => {
    mocks.getSession.mockResolvedValue({ playerId: "alf" });
    mocks.getCachedGeocodeLocation.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })));
    const { POST } = await import("./route");

    const response = await POST(request({
      answer: "Bergen",
      guesses: [{ playerId: "alf", text: "Oslo" }],
    }));
    const body = await response.json();

    expect(response.status).toBe(408);
    expect(body.error).toContain("lang tid");
  });
});
