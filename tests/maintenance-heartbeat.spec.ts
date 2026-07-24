import { expect, test } from "@playwright/test";

test("an active authenticated tab starts the maintenance heartbeat", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");

  const heartbeatRequest = page.waitForRequest(
    (request) => new URL(request.url()).pathname === "/api/maintenance/heartbeat" && request.method() === "POST",
  );
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  const request = await heartbeatRequest;
  const response = await request.response();
  expect(response?.status()).toBe(200);
});
