import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/store", () => ({
  getHydratedPlayerById: vi.fn(),
}));

const originalAuthSecret = process.env.AUTH_SECRET;
const originalPasscode = process.env.GEOTIA_PASSCODE;
const originalVercel = process.env.VERCEL;
const originalNodeEnv = process.env.NODE_ENV;

function setNodeEnv(value: string | undefined) {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

afterEach(() => {
  if (originalAuthSecret === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = originalAuthSecret;
  if (originalPasscode === undefined) delete process.env.GEOTIA_PASSCODE;
  else process.env.GEOTIA_PASSCODE = originalPasscode;
  if (originalVercel === undefined) delete process.env.VERCEL;
  else process.env.VERCEL = originalVercel;
  setNodeEnv(originalNodeEnv);
  vi.resetModules();
});

describe("Geotia auth configuration", () => {
  it("accepts natural geot names and party aliases as login names", async () => {
    const { playerIdFromUsername } = await import("@/lib/auth");

    expect(playerIdFromUsername("PWP")).toBe("ruben");
    expect(playerIdFromUsername("Glenn Ruben")).toBe("ruben");
    expect(playerIdFromUsername("Glenn")).toBe("ruben");
    expect(playerIdFromUsername("Ruben")).toBe("ruben");
    expect(playerIdFromUsername("Jorgen")).toBe("jorgen");
  });

  it("allows local development defaults outside production", async () => {
    delete process.env.AUTH_SECRET;
    delete process.env.GEOTIA_PASSCODE;
    delete process.env.VERCEL;
    setNodeEnv("test");
    vi.resetModules();

    const { isCorrectPasscode } = await import("@/lib/auth");

    expect(isCorrectPasscode("geotia")).toBe(true);
  }, 15_000);

  it("requires a non-default passcode on Vercel", async () => {
    process.env.VERCEL = "1";
    process.env.AUTH_SECRET = "a-real-production-secret";
    delete process.env.GEOTIA_PASSCODE;
    vi.resetModules();

    const { isCorrectPasscode } = await import("@/lib/auth");

    expect(() => isCorrectPasscode("geotia")).toThrow("GEOTIA_PASSCODE");
  });

  it("requires a non-default auth secret on Vercel", async () => {
    process.env.VERCEL = "1";
    process.env.AUTH_SECRET = "local-geotia-auth-secret-change-on-vercel";
    process.env.GEOTIA_PASSCODE = "not-the-local-default";
    vi.resetModules();

    const { verifyToken } = await import("@/lib/auth");

    expect(() => verifyToken("payload.signature")).toThrow("AUTH_SECRET");
  });
});
