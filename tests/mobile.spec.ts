import { expect, test, type Page } from "@playwright/test";

async function login(page: Page) {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });
}

async function expectNoHorizontalOverflow(page: Page) {
  const result = await page.evaluate(() => {
    const root = document.documentElement;
    const hasScrollableAncestor = (element: Element) => {
      let parent = element.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        const canScrollX = style.overflowX === "auto" || style.overflowX === "scroll";
        if (canScrollX && parent.scrollWidth > parent.clientWidth + 2) return true;
        parent = parent.parentElement;
      }
      return false;
    };
    const offenders = Array.from(document.querySelectorAll("body *"))
      .filter((element) => !hasScrollableAncestor(element))
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 80) ?? "",
          left: Math.round(rect.left),
          right: Math.round(rect.right),
          width: Math.round(rect.width),
        };
      })
      .filter((item) => item.width > 0 && (item.left < -2 || item.right > window.innerWidth + 2))
      .slice(0, 8);

    return {
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      offenders,
    };
  });

  expect(result.scrollWidth, JSON.stringify(result.offenders, null, 2)).toBeLessThanOrEqual(result.clientWidth + 2);
  expect(result.offenders, JSON.stringify(result.offenders, null, 2)).toHaveLength(0);
}

test("core pages do not overflow horizontally on mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);

  for (const route of [
    "/",
    "/spill",
    "/tabeller",
    "/geotinget",
    "/geotinget/avstemninger",
    "/geotinget/pergamenter",
    "/min-geot",
    "/ordenen",
    "/arkiv",
  ]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});
