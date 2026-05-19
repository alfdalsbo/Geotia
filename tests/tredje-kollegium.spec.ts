import { expect, test, type Page } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const competingPlayerIds = ["alf", "vegard", "steinar", "jorgen", "sverre", "fredrik", "danny"];

async function login(page: Page, username: string) {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill(username);
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });
}

for (const username of ["SS", "PKK", "IRA"]) {
  test(`Tredje Kollegium is reachable through Min geot for ${username}`, async ({ page }) => {
    await login(page, username);

    await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Hovednavigasjon" }).getByRole("link", { name: "Min geot" }).click();
    await expect(page.getByRole("heading", { name: /Alf Kåre|Steinar|Vegard/ })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toBeVisible();
    await page.getByRole("link", { name: "Tredje Kollegium" }).click();
    await page.goto("/tredje-kollegium");
    await expect(page.getByRole("heading", { name: "Tredje Kollegium" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByRole("heading", { name: "GEOTERINDEKSEN" })).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText("Åpne poengsystemet")).toBeVisible();
    await expect(page.getByLabel("Vis større bilde: Seglet til Tredje Kollegium")).toBeVisible();
  });
}

async function writeSlowGeoDeleteFixture() {
  const timestamp = new Date().toISOString();
  const dataDir = path.join(process.cwd(), ".data");
  const roundId = "playwright-3k-delete-slowgeo";
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "playwright-geotia.json"),
    JSON.stringify(
      {
        meta: { schemaVersion: "2" },
        rounds: [
          {
            id: roundId,
            number: 9,
            date: timestamp.slice(0, 10),
            name: "Slettbar SlowGeo-prøve",
            answer: "Tromsøbrua, Tromsø",
            answerLocation: {
              lat: 69.6534,
              lon: 18.975,
              label: "Tromsøbrua, Tromsø",
              query: "tromso-bridge",
              country: "Norge",
              source: "google_street_view",
            },
            mapSnapshot: null,
            slowGeoMode: "static",
            slowGeoStartedBy: "alf",
            slowGeoStartedAt: timestamp,
            slowGeoEraId: "proveaeraen",
            challenge: {
              id: "challenge-3k-delete",
              candidateId: "tromso-bridge",
              source: "google_street_view",
              lat: 69.6534,
              lon: 18.975,
              label: "Tromsøbrua, Tromsø",
              country: "Norge",
              continent: "Europa",
              heading: 64,
              pitch: 1,
              fov: 90,
              panoId: "playwright-pano-delete",
              createdAt: timestamp,
            },
            deadlineAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
            revealedAt: timestamp,
            country: "Norge",
            continent: "Europa",
            comment: "Google Street View",
            status: "locked",
            createdAt: timestamp,
            updatedAt: timestamp,
            results: competingPlayerIds.map((playerId, index) => ({
              playerId,
              status: "deltatt",
              actualKm: index + 1,
              guessText: `Pin ${index}`,
              guessLocation: {
                lat: 69.6534 + index * 0.01,
                lon: 18.975,
                label: `Pin ${index}`,
                query: "pin",
                source: "manual",
              },
              guessUpdatedAt: timestamp,
              distanceSource: "auto",
              note: "",
            })),
          },
        ],
        gameSessions: [],
        geotingProposals: [],
        geoterIndexAdjustments: [],
        geoticOrderAssessments: [],
        geoticOrderPromotionCases: [],
        geocodeCache: [],
      },
      null,
      2,
    ),
    "utf8",
  );
  return roundId;
}

test("Tredje Kollegium stays invisible for every non-member", async ({ page }) => {
  for (const username of ["PLO", "PWP", "CIP", "MOSSAD", "Danny"]) {
    await page.context().clearCookies();
    await login(page, username);

    await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Hovednavigasjon" }).getByRole("link", { name: "Min geot" }).click();
    await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toHaveCount(0);
    await expect(page.getByText("GEOTERINDEKSEN")).toHaveCount(0);
    const pageResponse = await page.goto("/tredje-kollegium");
    expect(pageResponse?.status()).toBe(404);

    const imageResponse = await page.goto("/tredje-kollegium/segl");
    expect(imageResponse?.status()).toBe(404);
  }
});

test("Tredje Kollegium can hard delete a SlowGeo round", async ({ page }) => {
  const roundId = await writeSlowGeoDeleteFixture();
  await login(page, "SS");

  await page.goto("/tredje-kollegium");
  await expect(page.getByRole("heading", { name: "SlowGeo-skuffen" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Slettbar SlowGeo-prøve", { exact: true })).toBeVisible();
  await expect(page.getByText("Den store prøveæraen")).toBeVisible();
  await page.getByRole("button", { name: "Slett" }).click();
  await expect(page.getByText("SlowGeo-runden er slettet.")).toBeVisible();

  await page.goto("/runder");
  await expect(page.getByText("Slettbar SlowGeo-prøve")).toHaveCount(0);
  await page.goto(`/slowgeo/${roundId}`);
  await expect(page.getByRole("heading", { name: "404" })).toBeVisible();
});
