import { expect, test } from "@playwright/test";

test("login, register a round, and lock the protocol", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Geotia" })).toBeVisible();
  await page.getByLabel("Geot", { exact: true }).selectOption("alf");
  await page.getByLabel("Geotisk adgangsfrase").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  await expect(page.getByRole("heading", { name: "Geotia" })).toBeVisible();
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
  await expect(page.getByText("Spilløkten er ført.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Geo-tabell", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "GeoTinget" }).click();
  await page.getByLabel("Tittel").fill("Lov om Playwright-ro");
  await page.getByLabel("Forslag / innhold").fill("Alle testgeoter skal få stemme uten parlamentarisk støy.");
  await page.getByRole("button", { name: "Send til GeoTinget" }).click();
  await expect(page.getByText("Forslaget er mottatt.")).toBeVisible();
  await page.getByRole("button", { name: "Avgi stemme" }).first().click();
  await expect(page.getByText("Stemmen er ført.")).toBeVisible();
});
