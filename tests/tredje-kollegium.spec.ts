import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, username: string) {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill(username);
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible();
}

test("Tredje Kollegium is visible for a member", async ({ page }) => {
  await login(page, "SS");

  await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toBeVisible();
  await page.getByRole("link", { name: "Tredje Kollegium" }).click();
  await expect(page.getByRole("heading", { name: "Tredje Kollegium" })).toBeVisible();
  await expect(page.getByText("Kun tre par øyne")).toBeVisible();
  await page.getByLabel("Vis større bilde: Seglet til Tredje Kollegium").click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("Tredje Kollegium stays invisible for non-members", async ({ page }) => {
  await login(page, "Danny");

  await expect(page.getByRole("link", { name: "Tredje Kollegium" })).toHaveCount(0);
  const pageResponse = await page.goto("/tredje-kollegium");
  expect(pageResponse?.status()).toBe(404);

  const imageResponse = await page.goto("/tredje-kollegium/segl");
  expect(imageResponse?.status()).toBe(404);
});
