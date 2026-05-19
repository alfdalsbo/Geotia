import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test, type Page } from "@playwright/test";

const competingPlayerIds = ["alf", "vegard", "jorgen", "steinar", "sverre", "fredrik", "ruben", "danny"];

const coreRoutes = [
  "/",
  "/spill/slowgeo",
  "/spill/registrer?game=geo",
  "/tabeller",
  "/stilling",
  "/runder",
  "/geotinget",
  "/geotinget/avstemninger",
  "/geotinget/pergamenter",
  "/min-geot",
  "/ordenen",
  "/arkiv",
  "/arkiv/partier",
  "/hall-of-fame",
  "/tredje-kollegium",
];

async function login(page: Page) {
  await page.goto("/");
  const logout = page.getByRole("button", { name: "Forlat embetsverket" });
  if (await logout.count()) {
    await expect(logout).toBeVisible({ timeout: 15_000 });
    return;
  }
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(logout).toBeVisible({ timeout: 15_000 });
}

async function expectInstitutionNav(page: Page) {
  const mainNav = page.getByRole("navigation", { name: "Hovednavigasjon" });
  for (const label of ["Kommandosentral", "SlowGeo", "GeoTinget", "Ordenen", "Riksarkivet", "Min geot"]) {
    await expect(mainNav.getByRole("link", { name: label })).toBeVisible();
  }
  await expect(mainNav.getByRole("link", { name: "Tabeller" })).toHaveCount(0);
  await expect(mainNav.getByRole("link", { name: "Spill", exact: true })).toHaveCount(0);
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

async function expectMainStartsBefore(page: Page, maxTop: number) {
  const mainTop = await page.locator("main").evaluate((element) => Math.round(element.getBoundingClientRect().top));
  expect(mainTop).toBeLessThanOrEqual(maxTop);
}

async function expectOneVisibleH1(page: Page) {
  const visibleH1s = await page.locator("h1").evaluateAll((elements) =>
    elements
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        const style = window.getComputedStyle(element);
        return rect.width > 0 && rect.height > 0 && style.display !== "none" && style.visibility !== "hidden";
      })
      .map((element) => element.textContent?.trim()),
  );
  expect(visibleH1s).toHaveLength(1);
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
          class StreetViewPanorama {
            constructor(element, options) {
              this.element = element;
              this.options = options;
              this.zoom = options.zoom ?? 1;
              this.pov = options.pov;
              this.status = "OK";
              element.dataset.streetViewPanorama = "ready";
              element.dataset.zoom = String(this.zoom);
              element.textContent = "Panorama mock";
            }
            addListener(eventName, handler) {
              return { remove() {} };
            }
            getStatus() { return this.status; }
            getZoom() { return this.zoom; }
            setPov(pov) {
              this.pov = pov;
              this.element.dataset.heading = String(pov.heading);
            }
            setZoom(zoom) {
              this.zoom = zoom;
              this.element.dataset.zoom = String(zoom);
            }
          }
          class LatLngBounds {
            extend() {}
          }
          window.google = { maps: { Map, Marker, Polyline, StreetViewPanorama, LatLngBounds, event: { trigger() {} } } };
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
            results: competingPlayerIds.map((playerId) => {
              const lockedGuesses: Record<string, { lat: number; lon: number; label: string; note: string }> = {
                vegard: {
                  lat: 60.3913,
                  lon: 5.3221,
                  label: "Bergen hemmelig pin",
                  note: "hemmelig vegard-notat",
                },
                steinar: {
                  lat: 63.4305,
                  lon: 10.3951,
                  label: "Trondheim hemmelig pin",
                  note: "hemmelig steinar-notat",
                },
              };
              const lockedGuess = lockedGuesses[playerId];

              return {
                playerId,
                status: "ikke_deltatt",
                actualKm: null,
                guessText: "",
                guessLocation: lockedGuess
                  ? {
                      lat: lockedGuess.lat,
                      lon: lockedGuess.lon,
                      label: lockedGuess.label,
                      query: lockedGuess.label.toLowerCase().replaceAll(" ", "-"),
                      country: "Norge",
                      source: "manual",
                    }
                  : null,
                guessUpdatedAt: lockedGuess ? timestamp : null,
                distanceSource: null,
                note: lockedGuess?.note ?? "",
              };
            }),
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

async function writeRevealedSlowGeoFixture() {
  const timestamp = new Date().toISOString();
  const roundId = "playwright-mobile-revealed-slowgeo";
  const dataDir = path.join(process.cwd(), ".data");
  const guesses: Record<string, { lat: number; lon: number; label: string; actualKm: number; note?: string }> = {
    alf: {
      lat: 69.653,
      lon: 18.974,
      label: "Tromsøbrua nesten på streken",
      actualKm: 0.1,
      note: "Bro, fjell og nordlig selvtillit.",
    },
    vegard: {
      lat: 60.3913,
      lon: 5.3221,
      label: "Bergen",
      actualKm: 1221.4,
    },
    jorgen: {
      lat: 63.4305,
      lon: 10.3951,
      label: "Trondheim",
      actualKm: 787.2,
    },
    steinar: {
      lat: 59.9139,
      lon: 10.7522,
      label: "Oslo",
      actualKm: 1148.8,
    },
    sverre: {
      lat: 58.969,
      lon: 5.7331,
      label: "Stavanger",
      actualKm: 1343.6,
    },
    fredrik: {
      lat: 68.4385,
      lon: 17.4273,
      label: "Narvik",
      actualKm: 157.5,
    },
  };

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "playwright-geotia.json"),
    JSON.stringify(
      {
        meta: { schemaVersion: "2" },
        rounds: [
          {
            id: roundId,
            number: 2,
            date: timestamp.slice(0, 10),
            name: "Felles fasitkort-prøven",
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
              id: "challenge-mobile-revealed",
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
              panoId: "playwright-pano-revealed",
              imageDate: "2024-01",
              copyright: "© 2024 Google",
              difficulty: "lett",
              theme: "nordlysstat og norsk veifølelse",
              signature: "Fjell, vann og nordlig infrastruktur uten skam.",
              tags: ["norge", "nord", "bro"],
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
            results: competingPlayerIds.map((playerId) => {
              const guess = guesses[playerId];
              return {
                playerId,
                status: guess ? "deltatt" : "ikke_deltatt",
                actualKm: guess?.actualKm ?? null,
                guessText: guess?.label ?? "",
                guessLocation: guess
                  ? {
                      lat: guess.lat,
                      lon: guess.lon,
                      label: guess.label,
                      query: guess.label.toLowerCase().replaceAll(" ", "-"),
                      country: "Norge",
                      source: "manual",
                    }
                  : null,
                guessUpdatedAt: guess ? timestamp : null,
                distanceSource: guess ? "auto" : null,
                note: guess?.note ?? "",
              };
            }),
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

test("core pages do not overflow horizontally on mobile", async ({ page }) => {
  test.setTimeout(120_000);

  for (const viewport of [
    { width: 393, height: 900 },
    { width: 320, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await login(page);
    await expectInstitutionNav(page);

    for (const route of coreRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("button", { name: "Forlat embetsverket" }),
        `Expected authenticated app shell on ${route}; current URL: ${page.url()}`,
      ).toBeVisible({ timeout: 15_000 });
      await expectNoHorizontalOverflow(page);
    }
  }
});

test("mobile shell keeps the rikssti and route families clear", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await login(page);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    const mainNav = page.getByRole("navigation", { name: "Hovednavigasjon" });
    await expect(mainNav.getByRole("link", { name: "Kommandosentral" })).toBeVisible();
    const commandText = await mainNav.getByRole("link", { name: "Kommandosentral" }).innerText();
    expect(commandText).not.toContain("\n");
    await expect(page.getByTestId("rikssti")).toBeVisible();
    await expectMainStartsBefore(page, 430);
    await expectOneVisibleH1(page);

    for (const [route, heading] of [
      ["/tabeller", "Rikets tabeller"],
      ["/runder", "Runder og protokoller"],
      ["/stilling", "SlowGeo-tabell"],
      ["/hall-of-fame", "Æreshallen"],
    ] as const) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
      await expect(mainNav.getByRole("link", { name: "SlowGeo" })).toHaveAttribute("aria-current", "page");
      await expect(page.getByRole("navigation", { name: "SlowGeo" })).toBeVisible();
      await expectOneVisibleH1(page);
      await expectNoHorizontalOverflow(page);
    }

    await page.goto("/geotinget", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "GeoTinget" })).toBeVisible();
    await expect(mainNav.getByRole("link", { name: "GeoTinget" })).toHaveAttribute("aria-current", "page");
    const geotingSubnav = page.getByRole("navigation", { name: "GeoTinget" });
    await expect(geotingSubnav).toBeVisible();
    const geotingSubnavTop = await geotingSubnav.evaluate((element) => Math.round(element.getBoundingClientRect().top));
    expect(geotingSubnavTop).toBeLessThan(viewport.height);
    await expectOneVisibleH1(page);
    await expectNoHorizontalOverflow(page);

    await page.goto("/geotinget/avstemninger", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Stemmeurnen", exact: true })).toBeVisible();
    await expect(mainNav.getByRole("link", { name: "GeoTinget" })).toHaveAttribute("aria-current", "page");
    await expect(geotingSubnav.getByRole("link", { name: "Stemmeurnen" })).toHaveAttribute("aria-current", "page");
    await expectOneVisibleH1(page);
    await expectNoHorizontalOverflow(page);
  }
});

test("mobile forms and order progress use readable card layouts", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await login(page);

  await page.goto("/runder", { waitUntil: "domcontentloaded" });
  await expect(page.locator("table.responsive-protocol").first()).toBeVisible();
  await expect(page.locator('td[data-label="Km fra fasit"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Samlet stilling" })).toHaveCount(0);
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/spill", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/spill\/slowgeo$/);
  await expect(page.getByRole("heading", { name: "SlowGeo", exact: true })).toBeVisible();
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/tabeller", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "SlowGeo-tabell" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Geo-tabell", exact: true })).toHaveCount(0);
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/spill/registrer?game=geo", { waitUntil: "domcontentloaded" });
  await expect(page.locator("table.responsive-protocol").first()).toBeVisible();
  await expect(page.locator('td[data-label="Score / forsøk"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto("/min-geot", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("100% mot neste")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/ordenen", { waitUntil: "domcontentloaded" });
  await expect(page.getByTestId("personal-order-path").getByText("100%")).toHaveCount(0);
  await expect(page.getByText("ferd", { exact: true })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("Geoterindeksen is usable as mobile cards", async ({ page }) => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 320, height: 900 },
  ]) {
    await page.setViewportSize(viewport);
    await login(page);
    await page.goto("/tredje-kollegium", { waitUntil: "domcontentloaded" });

    await expect(page.getByRole("heading", { name: "GEOTERINDEKSEN" })).toBeVisible();
    await expect(page.getByTestId("geoter-index-adjustment-form")).toBeVisible();
    await expect(page.getByTestId("geoter-index-mobile-list")).toBeVisible();
    await expect(page.getByTestId("geoter-index-mobile-card").first()).toBeVisible();
    await expect(page.getByTestId("geoter-index-mobile-trends")).toBeVisible();
    await expect(page.getByTestId("geoter-index-desktop-table")).toBeHidden();

    const minControlHeight = await page
      .getByTestId("geoter-index-adjustment-form")
      .locator('select, textarea, input:not([type="hidden"])')
      .evaluateAll((elements) =>
        Math.min(...elements.map((element) => Math.round(element.getBoundingClientRect().height))),
      );
    expect(minControlHeight).toBeGreaterThanOrEqual(44);
    await expectNoHorizontalOverflow(page);
  }
});

test("SlowGeo answer map opens fullscreen on mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await mockGoogleMaps(page);
  const roundId = await writeOpenSlowGeoFixture();

  await page.goto(`/slowgeo/${roundId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("banner")).toBeVisible();
  const openGeotiaLink = page.getByRole("link", { name: "Åpne Geotia" });
  await expect(openGeotiaLink).toBeVisible();
  await expect(openGeotiaLink).toHaveAttribute("href", "/");
  await expect(page.getByRole("heading", { name: "Mobilkart-prøven" })).toBeVisible();
  await expect(page.getByText("Sett pinnen")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hvem har svart" })).toBeVisible();
  await expect(page.getByText("2/8 pin-svar låst")).toBeVisible();
  await expect(page.getByText("Vegard")).toBeVisible();
  await expect(page.getByText("Svar låst").first()).toBeVisible();
  await expect(page.getByText("Alf Kåre")).toBeVisible();
  await expect(page.getByText("Mangler pin").first()).toBeVisible();
  await expect(page.getByText("Bergen hemmelig pin")).toHaveCount(0);
  await expect(page.getByText("hemmelig vegard-notat")).toHaveCount(0);
  await expect(page.getByText("60.39130")).toHaveCount(0);
  await expect(page.getByText("Tromsøbrua, Tromsø")).toHaveCount(0);
  await expect(page.getByTestId("slowgeo-map-surface")).toBeVisible();
  await expect(page.getByText("Laster kart")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await login(page);

  await page.goto(`/slowgeo/${roundId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Laster kart")).toHaveCount(0);
  await page.getByTestId("slowgeo-map-surface").click({ position: { x: 160, y: 180 } });
  await expect(page.getByText("59.91270, 10.74610")).toBeVisible();
  await expectNoHorizontalOverflow(page);

  await page.goto(`/runder/${roundId}`, { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Mobilkart-prøven" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Hvem har svart" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rundestatus" })).toHaveCount(0);
  await expect(page.getByText("Google Street View", { exact: true })).toBeVisible();
  await expect(page.getByText("© 2024 Google")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.getByRole("button", { name: "Åpne SlowGeo-bildet i fullskjerm" }).click();
  const imageDialog = page.getByRole("dialog", { name: "SlowGeo-bilde i fullskjerm" });
  await expect(imageDialog).toBeVisible();
  await expect(imageDialog.getByTestId("slowgeo-panorama-viewport")).toHaveCount(0);
  await expect(imageDialog.getByTestId("slowgeo-image-viewport")).toBeVisible();
  const fullscreenImage = imageDialog.locator('img[alt="SlowGeo-bilde"]');
  await expect(fullscreenImage).toHaveAttribute("src", /size=640x640/);
  await expect(fullscreenImage).toHaveAttribute("src", /fov=90/);
  await imageDialog.getByRole("button", { name: "Zoom inn" }).click();
  await expect(imageDialog.getByText("150%")).toBeVisible();
  await expect(fullscreenImage).toHaveAttribute("src", /fov=60/);
  const imageViewport = imageDialog.getByTestId("slowgeo-image-viewport");
  await imageViewport.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    const startX = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const init = {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "touch",
      isPrimary: true,
    };

    element.dispatchEvent(new PointerEvent("pointerdown", { ...init, clientX: startX, clientY: y, button: 0, buttons: 1 }));
    element.dispatchEvent(new PointerEvent("pointermove", { ...init, clientX: rect.left + 2, clientY: y, button: 0, buttons: 1 }));
    element.dispatchEvent(new PointerEvent("pointerup", { ...init, clientX: rect.left + 2, clientY: y, button: 0, buttons: 0 }));
  });
  await expect
    .poll(async () => {
      const src = await fullscreenImage.getAttribute("src");
      return src ? new URL(src).searchParams.get("heading") : null;
    }, { timeout: 10_000 })
    .toBe("79");
  await expect
    .poll(async () => {
      const src = await fullscreenImage.getAttribute("src");
      return src ? new URL(src).searchParams.get("fov") : null;
    }, { timeout: 10_000 })
    .toBe("60");
  await expectNoHorizontalOverflow(page);
  await imageDialog.getByRole("button", { name: "Lukk bilde" }).click();
  await expect(imageDialog).toBeHidden();

  await page.getByRole("button", { name: "Vis kart i fullskjerm" }).click();
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

test("SlowGeo revealed card shows the same map card on answer page and overview", async ({ page }) => {
  test.setTimeout(120_000);
  await mockGoogleMaps(page);
  const roundId = await writeRevealedSlowGeoFixture();

  for (const viewport of [
    { width: 390, height: 900 },
    { width: 320, height: 900 },
  ]) {
    await page.setViewportSize(viewport);

    await page.goto(`/slowgeo/${roundId}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByText("SlowGeo #2 · Fasitkort")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Felles fasitkort-prøven", level: 2 })).toBeVisible();
    await expect(page.getByText("Fasit: Tromsøbrua, Tromsø", { exact: true })).toBeVisible();
    await expect(page.getByTestId("slowgeo-reveal-map-surface")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Resultat" })).toBeVisible();
    await expect(page.getByText("Tromsøbrua nesten på streken")).toBeVisible();

    await page.getByRole("button", { name: "Vis fasitkart i fullskjerm" }).click();
    const revealDialog = page.getByRole("dialog", { name: "SlowGeo-fasitkart" });
    await expect(revealDialog).toBeVisible();
    await expect(revealDialog.getByText("SlowGeo-kart")).toBeVisible();
    await expect(revealDialog.getByTestId("slowgeo-reveal-map-surface")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await revealDialog.getByRole("button", { name: "Lukk kart" }).click();
    await expect(revealDialog).toBeHidden();
    await expectNoHorizontalOverflow(page);

    await login(page);
    await page.goto("/spill/slowgeo", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Felles fasitkort-prøven", level: 2 })).toBeVisible();
    await expect(page.getByText("SlowGeo #2 · Fasitkort")).toBeVisible();
    await expect(page.getByTestId("slowgeo-reveal-map-surface")).toBeVisible();
    await expect(page.getByRole("link", { name: /Åpne fasitkort/ })).toHaveAttribute("href", `/slowgeo/${roundId}`);
    await expect(page.getByRole("link", { name: "Protokoll", exact: true })).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  }
});
