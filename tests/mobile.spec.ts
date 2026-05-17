import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const competingPlayerIds = ["alf", "vegard", "jorgen", "steinar", "sverre", "danny"];

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

async function mockGoogleMaps(page: Page) {
  await page.route("https://maps.googleapis.com/maps/api/js**", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `
        (() => {
          class Map {
            constructor(element, options) {
              this.element = element;
              this.center = options.center;
              this.zoom = options.zoom;
            }
            addListener(eventName, handler) {
              if (eventName !== "click") return { remove() {} };
              const listener = () => handler({ latLng: { lat: () => 59.9127, lng: () => 10.7461 } });
              this.element.addEventListener("click", listener);
              return { remove: () => this.element.removeEventListener("click", listener) };
            }
            fitBounds() {}
            setCenter(point) { this.center = point; }
            setZoom(zoom) { this.zoom = zoom; }
          }
          class Marker {
            constructor(options) {
              this.map = options.map;
              this.position = options.position;
            }
            setMap(map) { this.map = map; }
            setPosition(point) { this.position = point; }
          }
          class Polyline {
            constructor(options) { this.map = options.map; }
            setMap(map) { this.map = map; }
          }
          class LatLngBounds {
            extend() {}
          }
          window.google = { maps: { Map, Marker, Polyline, LatLngBounds, event: { trigger() {} } } };
        })();
      `,
    });
  });
}

async function writeOpenSlowGeoFixture() {
  const timestamp = new Date().toISOString();
  const deadlineAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const roundId = "playwright-mobile-slowgeo";
  const dataDir = path.join(process.cwd(), ".data");
  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "playwright-geotia.json"),
    JSON.stringify(
      {
        meta: { schemaVersion: "2" },
        rounds: [
          {
            id: roundId,
            number: 1,
            date: timestamp.slice(0, 10),
            name: "Mobilkart-prøven",
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
            challenge: {
              id: "challenge-mobile",
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
              panoId: "playwright-pano",
              imageDate: "2024-01",
              copyright: "© 2024 Google",
              difficulty: "lett",
              theme: "nordlysstat og norsk veifølelse",
              signature: "Fjell, vann og nordlig infrastruktur uten skam.",
              tags: ["norge", "nord", "bro"],
              createdAt: timestamp,
            },
            deadlineAt,
            revealedAt: null,
            country: "Norge",
            continent: "Europa",
            comment: "Google Street View",
            status: "open",
            createdAt: timestamp,
            updatedAt: timestamp,
            results: competingPlayerIds.map((playerId) => ({
              playerId,
              status: "ikke_deltatt",
              actualKm: null,
              guessText: "",
              guessLocation: null,
              guessUpdatedAt: null,
              distanceSource: null,
              note: "",
            })),
          },
        ],
        gameSessions: [],
        geotingProposals: [],
        geoterIndexAdjustments: [],
        geoticOrderAssessments: [],
        geocodeCache: [],
      },
      null,
      2,
    ),
    "utf8",
  );
  return roundId;
}

test("core pages do not overflow horizontally on mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await login(page);

  for (const route of [
    "/",
    "/spill",
    "/spill/slowgeo",
    "/spill/registrer?game=geo",
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

test("SlowGeo answer map opens fullscreen on mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await mockGoogleMaps(page);
  const roundId = await writeOpenSlowGeoFixture();
  await login(page);

  await page.goto(`/runder/${roundId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mobilkart-prøven" })).toBeVisible();
  await expect(page.getByText("Google Street View", { exact: true })).toBeVisible();
  await expect(page.getByText("© 2024 Google")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Åpne SlowGeo-bildet i fullskjerm" }).click();
  const imageDialog = page.getByRole("dialog", { name: "SlowGeo-bilde i fullskjerm" });
  await expect(imageDialog).toBeVisible();
  await imageDialog.getByRole("button", { name: "Zoom inn" }).click();
  await expect(imageDialog.getByText("150%")).toBeVisible();
  await expectNoHorizontalOverflow(page);
  await imageDialog.getByRole("button", { name: "Lukk bilde" }).click();
  await expect(imageDialog).toBeHidden();

  await page.getByRole("button", { name: "Sett pin i fullskjermkart" }).click();
  const dialog = page.getByRole("dialog", { name: "Sett pin i kart" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("SlowGeo-kart")).toBeVisible();

  await dialog.getByTestId("slowgeo-map-surface").click({ position: { x: 160, y: 180 } });
  await expect(dialog.getByText("59.91270, 10.74610")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Send pin-svar" })).toBeEnabled();
  await expectNoHorizontalOverflow(page);

  await dialog.getByRole("button", { name: "Lukk kart" }).click();
  await expect(dialog).toBeHidden();
});
