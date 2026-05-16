# Geotia

Privat Vercel-app for SlowGeo, kattometeret, GeoTinget og Geotias riksarkiv.

## Lokal kjøring

```bash
npm install
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
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Geotisk lov

- Poeng: 7, 6, 5, 4, 3, 2, 1 etter avstand fra fasit.
- Delt plassering får poengsummen til den delte plasseringen.
- Ikke deltatt og ugyldig svar gir 0 poeng.
- Kattometerstraff for ikke-deltakelse/ugyldig svar er snittet av de tre
  dårligste gyldige km-resultatene i runden.
- Minst fem gyldige deltakere må føres før protokollen kan låses.
