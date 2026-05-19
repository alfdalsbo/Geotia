# Geotia

Privat Vercel-app for SlowGeo, kattometeret, GeoTinget og Geotias riksarkiv.

## Samarbeid

`geotia-web` på branchen `geo-design-v2` er offisiell arbeidsbase. Del arbeid
via GitHub-klone og egne branches, ikke ved å kopiere hele lokale mapper med
`.git`, `node_modules`, `.next`, `.vercel`, `.data` eller `.env.local`.

Se `AGENTS.md` for felles regler for Codex og Claude Code, og `CONTRIBUTING.md`
for menneskelig arbeidsflyt.

## Lokal kjøring

```bash
npm ci
npm run dev
```

Standard lokal adgangsfrase er `geotia`. Sett `GEOTIA_PASSCODE` og `AUTH_SECRET`
i miljøet for reell bruk.

## Lagring

Appen støtter Neon/Postgres via `DATABASE_URL`. Uten `DATABASE_URL` bruker den
lokal filprotokoll under `.data/`, og på Vercel faller den tilbake til midlertidig
lager. For varig delt lagring på Vercel må `DATABASE_URL` settes.

## Kontroll

```bash
npm run verify
npm run verify:e2e
```

`npm run verify` kjører lint, unit-tester og produksjonsbygg. Bruk
`npm run verify:e2e` eller målrettet Playwright/browser-sjekk ved synlige
UI-endringer.

## Geotisk lov

- Poeng: 7, 6, 5, 4, 3, 2, 1 etter avstand fra fasit.
- Delt plassering får poengsummen til den delte plasseringen.
- Ikke deltatt og ugyldig svar gir 0 poeng.
- Kattometerstraff for ikke-deltakelse/ugyldig svar er snittet av de tre
  dårligste gyldige km-resultatene i runden.
- Minst fem gyldige deltakere må føres før protokollen kan låses.
