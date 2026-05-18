import { expect, test, type Page } from "@playwright/test";

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
