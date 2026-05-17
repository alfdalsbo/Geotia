import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, username: string) {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill(username);
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });
}

test("Den Geotiske Orden is public without revealing the Third College", async ({ page }) => {
  await login(page, "Danny");

  await expect(page.getByRole("link", { name: "Ordenen" })).toHaveCount(0);
  await page.goto("/ordenen");
  await expect(page.getByRole("heading", { name: "Den Geotiske Orden" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Veien opp gjennom Geotia" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Borger av Geotia" }).first()).toBeVisible();
  await expect(page.getByText("GEOTERINDEKSEN")).toHaveCount(0);
  await expect(page.getByText("Tredje Kollegium")).toHaveCount(0);
  await expect(page.getByText("Ordensforvaltningen")).toHaveCount(0);
});

test("The order control room is only inside Tredje Kollegium", async ({ page }) => {
  await login(page, "SS");

  await page.goto("/tredje-kollegium");
  await expect(page.getByRole("heading", { name: "Ordensforvaltningen" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Før rang i ordenen" })).toBeVisible();
  await expect(page.getByText("Skjult type")).toBeVisible();
});
