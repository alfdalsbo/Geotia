import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect, test } from "@playwright/test";

const competingPlayerIds = ["alf", "vegard", "jorgen", "steinar", "sverre", "fredrik", "ruben", "danny"];

async function writeSlowGeoProtocolFixture({
  roundId = "playwright-slowgeo-protocol",
  name = "Protokollkortets prøverunde",
  startedBy = "alf",
}: {
  roundId?: string;
  name?: string;
  startedBy?: string;
} = {}) {
  const timestamp = new Date().toISOString();
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
            number: 7,
            date: timestamp.slice(0, 10),
            name,
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
            slowGeoMode: "static",
            slowGeoStartedBy: startedBy,
            slowGeoStartedAt: timestamp,
            challenge: {
              id: "challenge-protocol",
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
              panoId: "playwright-protocol-pano",
              imageDate: "2024-01",
              copyright: "© 2024 Google",
              difficulty: "lett",
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
              const actualKm = playerId === "alf" ? 0.4 : playerId === "vegard" ? 1221.4 : null;
              return {
                playerId,
                status: actualKm === null ? "ikke_deltatt" : "deltatt",
                actualKm,
                guessText: actualKm === null ? "" : playerId === "alf" ? "Tromsøbrua nesten riktig" : "Bergen",
                guessLocation:
                  actualKm === null
                    ? null
                    : {
                        lat: playerId === "alf" ? 69.653 : 60.3913,
                        lon: playerId === "alf" ? 18.974 : 5.3221,
                        label: playerId === "alf" ? "Tromsøbrua nesten riktig" : "Bergen",
                        query: playerId === "alf" ? "tromso-pin" : "bergen",
                        country: "Norge",
                        source: "manual",
                      },
                guessUpdatedAt: actualKm === null ? null : timestamp,
                distanceSource: actualKm === null ? null : "auto",
                note: "",
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

test("login and open the SlowGeo protocol archive", async ({ page }) => {
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

  const roundId = await writeSlowGeoProtocolFixture();
  await page.goto("/runder");

  await expect(page.getByRole("heading", { name: "Rundeprotokoll" })).toBeVisible();
  await expect(page.getByTestId("slowgeo-protocol-card")).toBeVisible();
  await expect(page.getByText("Protokollkortets prøverunde")).toBeVisible();
  await expect(page.getByText("Reist av: Alf Kåre")).toBeVisible();
  await expect(page.getByLabel("Rundenavn")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Lagre protokoll" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: /Åpne fasitkort/ })).toHaveAttribute("href", `/slowgeo/${roundId}`);

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

test("SlowGeo protocol archive opens the shared answer card", async ({ page }) => {
  const roundId = await writeSlowGeoProtocolFixture({
    roundId: "playwright-slowgeo-answer-card",
    name: "Kartprotokollen uten skjema",
  });
  await page.goto("/");
  await page.getByLabel("Brukernavn").fill("SS");
  await page.getByLabel("Passord").fill("geotia");
  await page.getByRole("button", { name: "Åpne Geotia" }).click();
  await expect(page.getByRole("button", { name: "Forlat embetsverket" })).toBeVisible({ timeout: 15_000 });
  await page.goto("/runder");

  await Promise.all([
    page.waitForURL(new RegExp(`/slowgeo/${roundId}$`)),
    page.getByRole("link", { name: /Åpne fasitkort/ }).click(),
  ]);
  await expect(page.getByRole("heading", { name: "Kartprotokollen uten skjema", level: 1 })).toBeVisible({
    timeout: 15_000,
  });
  await expect(page.getByText("SlowGeo #7 · Fasitkort")).toBeVisible();
  await expect(page.getByText(/Reist av Alf Kåre/).first()).toBeVisible();
  await expect(page.getByText("Fasit: Tromsøbrua, Tromsø", { exact: true })).toBeVisible();
});
