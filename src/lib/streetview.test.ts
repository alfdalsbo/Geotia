import { afterEach, describe, expect, it, vi } from "vitest";

import { createStreetViewChallenge, slowGeoCandidates } from "@/lib/streetview";

function metadataResponse(body: Record<string, unknown>) {
  return {
    ok: true,
    json: async () => body,
  } as Response;
}

describe("Street View challenge selection", () => {
  const originalServerKey = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  const originalPublicKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  afterEach(() => {
    if (originalServerKey === undefined) {
      delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
    } else {
      process.env.GOOGLE_MAPS_SERVER_API_KEY = originalServerKey;
    }
    if (originalPublicKey === undefined) {
      delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    } else {
      process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY = originalPublicKey;
    }
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("keeps a large curated candidate pool with unique ids", () => {
    const ids = slowGeoCandidates.map((candidate) => candidate.id);
    expect(slowGeoCandidates.length).toBeGreaterThanOrEqual(500);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("fails instead of recycling when all curated candidates are used", async () => {
    delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    await expect(
      createStreetViewChallenge({
        excludeCandidateIds: slowGeoCandidates.map((candidate) => candidate.id),
      }),
    ).rejects.toThrow("Alle kuraterte SlowGeo-bilder er brukt");
  });

  it("skips panoramas whose attribution reveals the candidate and tries the next one", async () => {
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "unit-test-key";
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        metadataResponse({
          status: "OK",
          pano_id: "unsafe-pano",
          date: "2024-01",
          copyright: "© Visit Sarajevo",
        }),
      )
      .mockResolvedValueOnce(
        metadataResponse({
          status: "OK",
          pano_id: "safe-pano",
          date: "2024-02",
          copyright: "© Mari",
        }),
      );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const challenge = await createStreetViewChallenge({
      excludeCandidateIds: slowGeoCandidates.slice(2).map((candidate) => candidate.id),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(challenge.candidateId).toBe(slowGeoCandidates[1].id);
    expect(challenge.panoId).toBe("safe-pano");
  });

  it("skips Street View pano ids that have already been used", async () => {
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "unit-test-key";
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        metadataResponse({
          status: "OK",
          pano_id: "used-pano",
          date: "2024-01",
          copyright: "© Mari",
        }),
      )
      .mockResolvedValueOnce(
        metadataResponse({
          status: "OK",
          pano_id: "fresh-pano",
          date: "2024-02",
          copyright: "© Mari",
        }),
      );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const challenge = await createStreetViewChallenge({
      excludeCandidateIds: slowGeoCandidates.slice(2).map((candidate) => candidate.id),
      excludePanoIds: ["used-pano"],
      requirePanoId: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(challenge.candidateId).toBe(slowGeoCandidates[1].id);
    expect(challenge.panoId).toBe("fresh-pano");
  });

  it("allows neutral photographer attribution that does not reveal the place", async () => {
    process.env.GOOGLE_MAPS_SERVER_API_KEY = "unit-test-key";
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const fetchMock = vi.fn().mockResolvedValueOnce(
      metadataResponse({
        status: "OK",
        pano_id: "neutral-pano",
        date: "2024-01",
        copyright: "© Mari",
      }),
    );
    vi.stubGlobal("fetch", fetchMock as unknown as typeof fetch);

    const challenge = await createStreetViewChallenge({
      excludeCandidateIds: slowGeoCandidates.slice(1).map((candidate) => candidate.id),
      requirePanoId: true,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(challenge.candidateId).toBe(slowGeoCandidates[0].id);
    expect(challenge.panoId).toBe("neutral-pano");
  });

  it("requires metadata pano id when Panorama mode asks for one", async () => {
    delete process.env.GOOGLE_MAPS_SERVER_API_KEY;
    delete process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    await expect(createStreetViewChallenge({ requirePanoId: true })).rejects.toThrow("Panorama-modus");
  });
});
