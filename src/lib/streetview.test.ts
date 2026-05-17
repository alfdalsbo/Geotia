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

  it("skips panoramas with revealing attribution and tries the next candidate", async () => {
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
          copyright: "© Mari",
        }),
      )
      .mockResolvedValueOnce(
        metadataResponse({
          status: "OK",
          pano_id: "safe-pano",
          date: "2024-02",
          copyright: "© 2024 Google",
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
});
