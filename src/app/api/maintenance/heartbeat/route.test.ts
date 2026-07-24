import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  runInteractiveMaintenance: vi.fn(),
  revalidateGeoticOrderPaths: vi.fn(),
  revalidateGeotingAdminPaths: vi.fn(),
  revalidateSlowGeoPaths: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({
  getSession: mocks.getSession,
}));

vi.mock("@/lib/store", () => ({
  runInteractiveMaintenance: mocks.runInteractiveMaintenance,
}));

vi.mock("@/lib/revalidation", () => ({
  revalidateGeoticOrderPaths: mocks.revalidateGeoticOrderPaths,
  revalidateGeotingAdminPaths: mocks.revalidateGeotingAdminPaths,
  revalidateSlowGeoPaths: mocks.revalidateSlowGeoPaths,
}));

afterEach(() => {
  vi.restoreAllMocks();
  Object.values(mocks).forEach((mock) => mock.mockReset());
});

describe("maintenance heartbeat API", () => {
  it("rejects requests without a valid session", async () => {
    mocks.getSession.mockResolvedValue(null);
    const { POST } = await import("./route");

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.runInteractiveMaintenance).not.toHaveBeenCalled();
  });

  it("runs maintenance for an authenticated Geot and revalidates changed areas", async () => {
    mocks.getSession.mockResolvedValue({ playerId: "alf" });
    mocks.runInteractiveMaintenance.mockResolvedValue({
      geoting: { resolved: 1 },
      slowGeo: { revealed: 1 },
      geoticOrderPromotionCases: 1,
    });
    const { POST } = await import("./route");

    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.revalidateSlowGeoPaths).toHaveBeenCalledOnce();
    expect(mocks.revalidateGeotingAdminPaths).toHaveBeenCalledOnce();
    expect(mocks.revalidateGeoticOrderPaths).toHaveBeenCalledOnce();
  });

  it("reports temporary maintenance failure without exposing database details", async () => {
    mocks.getSession.mockResolvedValue({ playerId: "alf" });
    mocks.runInteractiveMaintenance.mockRejectedValue(new Error("Neon database details"));
    const { POST } = await import("./route");

    const response = await POST();
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body.error).not.toContain("Neon");
  });
});
