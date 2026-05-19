import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

async function writeGeotingRoutingFixture() {
  const timestamp = new Date().toISOString();
  const votingStartedAt = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const votingEndsAt = new Date(Date.now() + 23 * 60 * 60 * 1000).toISOString();
  const dataDir = path.join(process.cwd(), ".data");
  const proposals = [
    {
      id: "playwright-geoting-open",
      title: "Lov om levende tingvoll",
      body: "Denne saken skal vente på geo-ed i Stemmeurnen.",
      ruleType: "annet",
      proposedBy: "alf",
      status: "open",
      createdAt: "2026-05-18T08:00:00.000Z",
      updatedAt: "2026-05-18T08:00:00.000Z",
      votes: [],
    },
    {
      id: "playwright-geoting-voting",
      title: "Lov om åpen urne",
      body: "Denne saken skal være aktiv avstemning i Stemmeurnen.",
      ruleType: "mindre",
      proposedBy: "alf",
      status: "voting",
      createdAt: "2026-05-18T09:00:00.000Z",
      updatedAt: votingStartedAt,
      voteStartedAt: votingStartedAt,
      voteEndsAt: votingEndsAt,
      voteStartedBy: "alf",
      oathText: "Geo-eden er ført for testurnen.",
      votes: [
        {
          playerId: "alf",
          vote: "for",
          comment: "",
          createdAt: "2026-05-18T09:08:00.000Z",
        },
      ],
    },
    {
      id: "playwright-geoting-passed",
      title: "Lov om vedtaksrullen",
      body: "Denne saken skal ligge i Vedtaksrullen.",
      ruleType: "mindre",
      proposedBy: "alf",
      status: "passed",
      createdAt: "2026-05-17T08:00:00.000Z",
      updatedAt: "2026-05-18T10:00:00.000Z",
      voteStartedAt: "2026-05-17T08:10:00.000Z",
      voteEndsAt: "2026-05-18T08:10:00.000Z",
      voteStartedBy: "alf",
      resolvedAt: "2026-05-18T10:00:00.000Z",
      votes: ["alf", "vegard", "jorgen", "steinar"].map((playerId) => ({
        playerId,
        vote: "for",
        comment: "",
        createdAt: "2026-05-17T09:00:00.000Z",
      })),
    },
    {
      id: "playwright-geoting-rejected",
      title: "Lov om forkastelsesbunken",
      body: "Denne saken skal ligge i Forkastelsesbunken.",
      ruleType: "annet",
      proposedBy: "vegard",
      status: "rejected",
      createdAt: "2026-05-16T08:00:00.000Z",
      updatedAt: "2026-05-18T11:00:00.000Z",
      voteStartedAt: "2026-05-16T08:10:00.000Z",
      voteEndsAt: "2026-05-17T08:10:00.000Z",
      voteStartedBy: "vegard",
      resolvedAt: "2026-05-18T11:00:00.000Z",
      votes: [
        {
          playerId: "alf",
          vote: "for",
          comment: "",
          createdAt: "2026-05-16T09:00:00.000Z",
        },
        ...["vegard", "jorgen", "steinar", "sverre"].map((playerId) => ({
          playerId,
          vote: "mot",
          comment: "",
          createdAt: "2026-05-16T09:10:00.000Z",
        })),
      ],
    },
  ];

  await mkdir(dataDir, { recursive: true });
  await writeFile(
    path.join(dataDir, "playwright-geotia.json"),
    JSON.stringify(
      {
        meta: { schemaVersion: "2" },
        rounds: [],
        gameSessions: [],
        geotingProposals: proposals,
        geoterIndexAdjustments: [],
        geoticOrderAssessments: [],
        geoticOrderPromotionCases: [],
        geocodeCache: [],
        updatedAt: timestamp,
      },
      null,
      2,
    ),
    "utf8",
  );

  return {
    openTitle: proposals[0].title,
    votingTitle: proposals[1].title,
    passedId: proposals[2].id,
    passedTitle: proposals[2].title,
    rejectedTitle: proposals[3].title,
  };
}

test("login, register a round, and lock the protocol", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "G·E·O·T·I·A" })).toBeVisible();
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  await expect(page.getByRole("heading", { name: "Geotia", exact: true })).toBeVisible();
  const mainNav = page.getByRole("navigation", { name: "Hovednavigasjon" });
  await expect(mainNav.getByRole("link", { name: "Kommandosentral" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "SlowGeo" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "GeoTinget" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "Ordenen" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "Riksarkivet" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "Min geot" })).toBeVisible();
  await expect(mainNav.getByRole("link", { name: "Tabeller" })).toHaveCount(0);
  await expect(mainNav.getByRole("link", { name: "Spill", exact: true })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Samlet stilling" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Vis større bilde: Partikort for SS/ })).toHaveCount(0);
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);
  await page.goto("/runder");

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

  await page.goto("/tabeller");
  await expect(page.getByRole("cell", { name: /Alf Kåre/ }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Rikets tabeller" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "SlowGeo-tabell" })).toBeVisible();

  await page.goto("/spill/slowgeo");
  await expect(page.getByRole("heading", { name: "SlowGeo", exact: true })).toBeVisible();
  await page.goto("/spill");
  await expect(page).toHaveURL(/\/spill\/slowgeo$/);
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);
  await expect(page.getByText("Før ny spilløkt")).toHaveCount(0);
  await page.goto("/spill/registrer?game=geo");
  await page.getByLabel("Spill").selectOption("geo");
  await page.getByLabel("Navn på økt").fill("Geo-fellesprotokoll");
  await page.locator('select[name="status_alf"]').selectOption("deltatt");
  await page.locator('input[name="score_alf"]').fill("24000");
  await page.locator('select[name="status_vegard"]').selectOption("deltatt");
  await page.locator('input[name="score_vegard"]').fill("23000");
  await page.getByRole("button", { name: "Før spilløkt" }).click();
  await expect(page.getByText("Spilløkten er ført.")).toBeVisible();
  await page.goto("/tabeller");
  await expect(page.getByRole("heading", { name: "SlowGeo-tabell" })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole("heading", { name: "Geo-tabell", exact: true })).toHaveCount(0);
  await expect(page.getByText("MapTap")).toHaveCount(0);
  await expect(page.getByText("Satle")).toHaveCount(0);
  await expect(page.getByText("Globle")).toHaveCount(0);

  await mainNav.getByRole("link", { name: "GeoTinget" }).click();
  await expect(page.getByRole("link", { name: "Tingvollen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Stemmeurnen" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Tingpergamentene" })).toBeVisible();
  await page.getByRole("link", { name: "Tingpergamentene" }).click();
  await expect(page.getByRole("heading", { name: "Tingpergamentene" })).toBeVisible();
  await page.getByRole("link", { name: "Tingvollen" }).click();
  const proposalTitle = `Lov om Playwright-ro ${Date.now()}`;
  await page.getByLabel("Tittel").fill(proposalTitle);
  await page.getByLabel("Forslag / innhold").fill("Alle testgeoter skal få stemme uten parlamentarisk støy.");
  await page.getByRole("button", { name: "Send til GeoTinget" }).click();
  await expect(page.getByText("Forslaget er mottatt.")).toBeVisible();
  const proposalCard = page.getByTestId("geoting-case").filter({ hasText: proposalTitle });
  const proposalActionStrip = proposalCard.getByTestId("geoting-action-strip");
  await expect(proposalCard.locator("summary")).toBeVisible();
  await expect(proposalCard).toHaveAttribute("open", "");
  await expect(proposalActionStrip.getByText("Lukk sak")).toBeVisible();
  await proposalCard.locator("summary").click();
  await expect(proposalCard).not.toHaveAttribute("open", "");
  await expect(proposalActionStrip.getByText("Åpne geo-ed")).toBeVisible();
  await proposalCard.locator("summary").click();
  await expect(proposalCard).toHaveAttribute("open", "");

  await page.getByRole("link", { name: "Tingvollen" }).click();
  const secondProposalTitle = `Lov om Playwright-accordion ${Date.now()}`;
  await page.getByLabel("Tittel").fill(secondProposalTitle);
  await page.getByLabel("Forslag / innhold").fill("Andre testforslag skal lukke det første når det åpnes.");
  await page.getByRole("button", { name: "Send til GeoTinget" }).click();
  await expect(page.getByText("Forslaget er mottatt.")).toBeVisible();
  const secondProposalCard = page.getByTestId("geoting-case").filter({ hasText: secondProposalTitle });
  await expect(secondProposalCard).toHaveAttribute("open", "");
  await expect(proposalCard).not.toHaveAttribute("open", "");
  await proposalCard.locator("summary").click();
  await expect(proposalCard).toHaveAttribute("open", "");
  await expect(secondProposalCard).not.toHaveAttribute("open", "");

  await expect(proposalCard.getByRole("button", { name: "Åpne stemmeurnen" })).toBeVisible();
  await proposalCard.getByLabel("Jeg sverger geo-eden og varsler alle geoter umiddelbart.").check();
  await proposalCard.getByRole("button", { name: "Åpne stemmeurnen" }).click();
  await expect(page.getByText("Geo-eden er avlagt.", { exact: true })).toBeVisible();
  await expect(proposalCard).toHaveAttribute("open", "");
  await expect(proposalActionStrip.getByText("Lukk sak")).toBeVisible();
  await proposalCard.getByRole("button", { name: "Avgi stemme" }).click();
  await expect(page.getByText("Stemmen er ført.")).toBeVisible();
  await expect(proposalCard).toHaveAttribute("open", "");
  await page.getByRole("link", { name: "Tingpergamentene" }).click();
  await expect(page.getByRole("heading", { name: "Tingpergamentene" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Vedtaksrullen", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Forkastelsesbunken", exact: true })).toBeVisible();
  const pergament = page.getByTestId("geoting-pergament").filter({ hasText: proposalTitle });
  await expect(pergament).toHaveCount(0);
  await page.getByRole("link", { name: "Stemmeurnen", exact: true }).click();
  await expect(page.getByTestId("geoting-case").filter({ hasText: proposalTitle })).toBeVisible();
});

test("GeoTinget keeps live proposals in Stemmeurnen and resolved proposals in Tingpergamentene", async ({ page }) => {
  const fixture = await writeGeotingRoutingFixture();

  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });

  await page.goto("/geotinget/avstemninger");
  await expect(page.getByRole("heading", { name: "Stemmeurnen", exact: true })).toBeVisible();
  await expect(page.getByTestId("geoting-case").filter({ hasText: fixture.openTitle })).toBeVisible();
  await expect(page.getByTestId("geoting-case").filter({ hasText: fixture.votingTitle })).toBeVisible();
  await expect(page.getByText(fixture.passedTitle)).toHaveCount(0);
  await expect(page.getByText(fixture.rejectedTitle)).toHaveCount(0);

  await page.goto(`/geotinget/avstemninger?sak=${fixture.passedId}`);
  await expect(page).toHaveURL(new RegExp(`/geotinget/pergamenter\\?status=avgjort&sak=${fixture.passedId}$`));
  await expect(page.getByText("Saken er avgjort og lagt i riktig pergamenthylle.")).toBeVisible();

  const passedGroup = page.getByTestId("geoting-pergament-group-passed");
  const rejectedGroup = page.getByTestId("geoting-pergament-group-rejected");
  await expect(page.getByRole("heading", { name: "Vedtaksrullen", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Forkastelsesbunken", exact: true })).toBeVisible();
  await expect(passedGroup.getByTestId("geoting-pergament").filter({ hasText: fixture.passedTitle })).toHaveCount(1);
  await expect(rejectedGroup.getByTestId("geoting-pergament").filter({ hasText: fixture.rejectedTitle })).toHaveCount(1);
  await expect(passedGroup.getByText(fixture.rejectedTitle)).toHaveCount(0);
  await expect(rejectedGroup.getByText(fixture.passedTitle)).toHaveCount(0);
  await expect(page.getByTestId("geoting-pergament").filter({ hasText: fixture.openTitle })).toHaveCount(0);
  await expect(page.getByTestId("geoting-pergament").filter({ hasText: fixture.votingTitle })).toHaveCount(0);
});

test("Danny logs in as Tingvitne without voting power", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("Danny");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();

  await expect(page.getByText("Innlogget som Danny — Tingvitne")).toBeVisible();
  await page.getByRole("navigation", { name: "Hovednavigasjon" }).getByRole("link", { name: "GeoTinget" }).click();
  const geotingNav = page.getByRole("navigation", { name: "GeoTinget" });
  await expect(geotingNav.getByRole("link", { name: "Tingvollen", exact: true })).toBeVisible();
  await expect(geotingNav.getByRole("link", { name: "Stemmeurnen", exact: true })).toBeVisible();
  await expect(geotingNav.getByRole("link", { name: "Tingpergamentene", exact: true })).toBeVisible();
  await expect(page.getByText("Ordensport:")).toBeVisible();
  await expect(page.getByText("kan lese og mumle fra benken")).toBeVisible();
  await expect(page.getByText("Nivå 2 åpner enkle forslag")).toBeVisible();
  await geotingNav.getByRole("link", { name: "Stemmeurnen", exact: true }).click();
  await expect(page.getByRole("button", { name: "Avgi stemme" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Åpne stemmeurnen" })).toHaveCount(0);
  await expect(page.getByText("stiftet parti")).toHaveCount(0);
  await geotingNav.getByRole("link", { name: "Tingpergamentene", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tingpergamentene" })).toBeVisible();
  await expect(page.getByText("Kollegiets redigering")).toHaveCount(0);
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
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/runder");

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
  const archiveRow = page.getByRole("row").filter({ hasText: roundName });
  await Promise.all([
    page.waitForURL(/\/runder\/[^/]+$/),
    archiveRow.getByRole("link", { name: "Åpne" }).click(),
  ]);
  await expect(page.getByRole("heading", { name: roundName })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Kartprotokoll", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /Danny Tingvitne/ })).toBeVisible();
});
