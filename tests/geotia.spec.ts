import { expect, test } from "@playwright/test";

test("login, register a round, and lock the protocol", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geotia" })).toBeVisible();
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  await expect(page.getByRole("heading", { name: "Geotia" })).toBeVisible();
  await page.getByLabel("Vis større bilde: Partioversikt for Geotia").click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Lukk større bilde" }).click();
  await page.getByRole("link", { name: "SlowGeo", exact: true }).click();

  await page.getByLabel("Rundenavn").fill("Playwright-protokollen");
  await page.getByLabel("Fasit / sted").fill("Wien");
  await page.getByLabel("Land").fill("Østerrike");
  await page.getByLabel("Kontinent").fill("Europa");

  const rows = [
    ["alf", "10"],
    ["vegard", "20"],
    ["jorgen", "30"],
    ["steinar", "40"],
    ["sverre", "50"],
    ["danny", "60"],
  ];

  for (const [id, km] of rows) {
    await page.locator(`select[name="status_${id}"]`).selectOption("deltatt");
    await page.locator(`input[name="km_${id}"]`).fill(km);
  }

  await page.getByRole("button", { name: "Lagre protokoll" }).click();
  await expect(page.getByText("Protokollen er lagret.")).toBeVisible();
  await page.getByRole("button", { name: "Lås" }).first().click();
  await expect(page.getByText("Protokollen er låst. Kattometeret har talt.")).toBeVisible();

  await page.getByRole("link", { name: "SlowGeo-tabell" }).click();
  await expect(page.getByRole("cell", { name: /Alf Kåre/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "SlowGeo-tabell" })).toBeVisible();

  await page.getByRole("link", { name: "Spill" }).click();
  await page.getByLabel("Spill").selectOption("geo");
  await page.getByLabel("Navn på økt").fill("Geo-fellesprotokoll");
  await page.locator('select[name="status_alf"]').selectOption("deltatt");
  await page.locator('input[name="score_alf"]').fill("24000");
  await page.locator('select[name="status_vegard"]').selectOption("deltatt");
  await page.locator('input[name="score_vegard"]').fill("23000");
  await page.getByRole("button", { name: "Før spilløkt" }).click();
  await expect(page.getByRole("heading", { name: "Geo-tabell", exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("cell", { name: "24 000 poeng" }).first()).toBeVisible();

  await page.getByRole("link", { name: "GeoTinget" }).click();
  const proposalTitle = `Lov om Playwright-ro ${Date.now()}`;
  await page.getByLabel("Tittel").fill(proposalTitle);
  await page.getByLabel("Forslag / innhold").fill("Alle testgeoter skal få stemme uten parlamentarisk støy.");
  await page.getByRole("button", { name: "Send til GeoTinget" }).click();
  await expect(page.getByText("Forslaget er mottatt.")).toBeVisible();
  const proposalCard = page.locator("article").filter({ hasText: proposalTitle });
  await proposalCard.getByLabel("Jeg sverger geo-eden og varsler alle geoter umiddelbart.").check();
  await proposalCard.getByRole("button", { name: "Åpne stemmeurnen" }).click();
  await expect(page.getByText("Geo-eden er avlagt.")).toBeVisible();
  await proposalCard.getByRole("button", { name: "Avgi stemme" }).click();
  await expect(page.getByText("Stemmen er ført.")).toBeVisible();
});

test("Danny logs in as Tingvitne without voting power", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("Danny");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  await expect(page.getByText("Innlogget som Danny · Tingvitne")).toBeVisible();
  await page.getByRole("link", { name: "GeoTinget" }).click();
  await expect(page.getByText("Tingvitneprotokoll:")).toBeVisible();
  await expect(page.getByText("har ikke stemmerett")).toBeVisible();
  await expect(page.getByRole("button", { name: "Avgi stemme" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Åpne stemmeurnen" })).toHaveCount(0);
});

test("SlowGeo can auto-calculate distances and archive a map protocol", async ({ page }) => {
  await page.route("**/api/geocode/round-preview", async (route) => {
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        answerLocation: {
          lat: 48.2082,
          lon: 16.3738,
          label: "Wien, Østerrike",
          query: "Wien",
          country: "Østerrike",
          source: "nominatim",
        },
        results: [
          {
            playerId: "alf",
            location: {
              lat: 48.21,
              lon: 16.37,
              label: "Wien sentrum",
              query: "Wien sentrum",
              country: "Østerrike",
              source: "nominatim",
            },
            distanceKm: 0.4,
          },
          {
            playerId: "vegard",
            location: {
              lat: 47.4979,
              lon: 19.0402,
              label: "Budapest",
              query: "Budapest",
              country: "Ungarn",
              source: "nominatim",
            },
            distanceKm: 214.6,
          },
          {
            playerId: "jorgen",
            location: {
              lat: 50.0755,
              lon: 14.4378,
              label: "Praha",
              query: "Praha",
              country: "Tsjekkia",
              source: "nominatim",
            },
            distanceKm: 252.8,
          },
          {
            playerId: "steinar",
            location: {
              lat: 48.3069,
              lon: 14.2858,
              label: "Linz",
              query: "Linz",
              country: "Østerrike",
              source: "nominatim",
            },
            distanceKm: 154.9,
          },
          {
            playerId: "sverre",
            location: {
              lat: 47.0707,
              lon: 15.4395,
              label: "Graz",
              query: "Graz",
              country: "Østerrike",
              source: "nominatim",
            },
            distanceKm: 144.8,
          },
          {
            playerId: "danny",
            location: {
              lat: 48.2082,
              lon: 16.3738,
              label: "Wien, Østerrike",
              query: "Wien",
              country: "Østerrike",
              source: "nominatim",
            },
            distanceKm: 0,
          },
        ],
      }),
    });
  });

  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await page.getByRole("link", { name: "SlowGeo", exact: true }).click();

  const roundName = `Kartprotokollen ${Date.now()}`;
  await page.getByLabel("Rundenavn").fill(roundName);
  await page.getByLabel("Fasit / sted").fill("Wien");
  await page.locator('input[name="guess_text_alf"]').fill("Wien sentrum");
  await page.locator('input[name="guess_text_vegard"]').fill("Budapest");
  await page.locator('input[name="guess_text_jorgen"]').fill("Praha");
  await page.locator('input[name="guess_text_steinar"]').fill("Linz");
  await page.locator('input[name="guess_text_sverre"]').fill("Graz");
  await page.locator('input[name="guess_text_danny"]').fill("Wien");

  await page.getByRole("button", { name: "Beregn avstander" }).click();
  await expect(page.locator('input[name="km_danny"]')).toHaveValue("0");
  await expect(page.locator('select[name="status_danny"]')).toHaveValue("deltatt");

  await page.getByRole("button", { name: "Lagre protokoll" }).click();
  await expect(page.getByText("Protokollen er lagret.")).toBeVisible();
  await page.getByRole("row").filter({ hasText: roundName }).getByRole("link", { name: "Åpne" }).click();
  await expect(page.getByText("Kartprotokoll")).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Danny")).toBeVisible();
});
