# Geotia

Vercel-app for SlowGeo, kattometeret, GeoTinget og Geotias riksarkiv.
Geoversitetet finnes som lukket appflate på `/geoversitetet`; i første fase er
den bare synlig for Tredje Kollegium.

## Samarbeid

`main` er kanonisk felles base og representerer den nyeste produksjonsnære
tilstanden. Nye branches skal normalt opprettes fra oppdatert `main`.

Den eldre grenen `geo-design-v2` er bevart som historisk/alternativ utviklingsgren,
men er ikke lenger standard arbeidsbase. Den skal ikke flettes eller slettes
automatisk; dersom unik kode der senere skal gjenbrukes, vurderes den eksplisitt
mot dagens `main`.

Del arbeid via GitHub-klone og egne branches, ikke ved å kopiere hele lokale
mapper med `.git`, `node_modules`, `.next`, `.vercel`, `.data` eller `.env.local`.
`geotia-web-f7-clean` i foreldremappen er kun lokal referanse/worktree, ikke
stedet nye endringer skal implementeres.

### `_lokalt/`

Navnet er historisk. `_lokalt/` i dette repoet er **versjonsstyrt**, men holdes
utenfor Vercel-publisering når `.vercelignore` sier det. Det brukes til
prototype-/arbeidsarkiv som det er nyttig å bevare i Git-historikken, blant annet
Geoversitetet. Det skal derfor ikke behandles som maskinlokalt eller ucommittet
scratchområde.

Ekte maskinlokale filer er blant annet `.env.local`, `.data/`, `.vercel/`,
`.next/`, `node_modules/`, testartefakter og editorcacher. Nye ting som absolutt
ikke skal inn i Git, skal ligge i ignorert lokal plassering, ikke i den
versjonsstyrte `_lokalt/`-mappen.

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

`npm run verify` kjører lint, TypeScript-sjekk, unit-tester og produksjonsbygg. Bruk
`npm run verify:e2e` eller målrettet Playwright/browser-sjekk ved synlige
UI-endringer.

## SlowGeo-pool

```bash
npm run slowgeo:pool
npm run slowgeo:refill
```

SlowGeo-kandidater ligger i `src/data/slowgeo-candidates.json`. Refill-scriptet
skriver bare når ubrukt pool er under `SLOWGEO_POOL_LOW_WATERMARK`, og krever
`GOOGLE_MAPS_SERVER_API_KEY` når nye kandidater faktisk må valideres mot Street
View metadata.

## Geotisk lov

- Poeng: 7, 6, 5, 4, 3, 2, 1 etter avstand fra fasit.
- Delt plassering får poengsummen til den delte plasseringen.
- Ikke deltatt og ugyldig svar gir 0 poeng.
- Kattometerstraff for ikke-deltakelse/ugyldig svar er snittet av de tre
  dårligste gyldige km-resultatene i runden.
- Minst fem gyldige deltakere må føres før protokollen kan låses.
