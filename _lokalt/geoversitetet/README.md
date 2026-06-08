# Geoversitetet

Lokal arbeidsprototype for Geoversitetet, universitetet i Geotia.

Dette er fortsatt arbeidsarkivet for Geoversitetet. `_lokalt` er lagt i
`.vercelignore`, så innholdet her publiseres ikke direkte til Vercel.

Den publiserbare speilingen ligger nå i appen som `/geoversitetet`, med data
kopiert til `src/data/geoversitetet/` og beskyttede bilder servert via
route-handlere under `/geoversitetet/aktiva/...`. Foreløpig er ruten bare
synlig for Tredje Kollegium.

## Åpne lokalt

Åpne `index.html` direkte i nettleseren.

## Kanon

- Geoversitetet er universitetet i Geotia.
- Professorer heter **Geofessorer**.
- Alt handler om å lære geografi, men på geotisk vis: med kjennelære, feltblikk,
  SlowGeo-praksis, kartskam, protokoll og mistenksom respekt for små detaljer.
- Kjennelæren er et hovedfag, ikke pynt.
- Kattologi og Kattemagen er nå et eget fakultet for intuitiv geovitenskap.
- Geofessoratets diplomarkiv føres lokalt med ett oppdatert rektoratsdiplom
  og tre geofessordiplomer.
- Logoen ligger lokalt i `assets/geoversitetet-logo.jpeg` og skal ikke flyttes
  til `public/` før Geoversitetet faktisk skal inn i Vercel-appen.

## Lokale filer

- `index.html` - første lokale, statiske forside.
- `styles.css` - lokal design for prototypen.
- `fagkatalog.json` - strukturert førsteutkast til fag, avdelinger og roller.
- `geoversitetet-kanon.md` - tekstlig kanon og videre retning.
- `assets/geoversitetet-logo.jpeg` - lokal kopi av logoen du ga.
- `assets/oyologi-kunngjoring.jpeg` - lokal kursplakat for OYO-101.
- `assets/geofessor-steinar-lofnes.jpeg` - lokalt diplom for Rector Magnificus.
- `assets/geofessor-steinar-lofnes.png` - oppdatert rektoratsdiplom.
- `assets/geofessor-alf-kare-dalsbo.png` - geofessordiplom for Alf Kåre Dalsbø.
- `assets/geofessor-vegard-lofnes.png` - geofessordiplom for Vegard Lofnes.
- `assets/geofessor-sverre-skilbreid.png` - geofessordiplom for Sverre Skilbreid.

## Vercel-speiling

- `src/data/geoversitetet/fagkatalog.json` - appens publiserbare kopi av kanonen.
- `src/app/(app)/geoversitetet` - lukket Geoversitetet-rute i appen.
- `src/app/(app)/geoversitetet/aktiva/[asset]` - beskyttet bildearkiv.
- `src/lib/geoversitetet.ts` - tilgangsgate, typedata og asset-allowlist.

Åpning for hele riket senere skal kunne gjøres ved å endre
`canViewGeoversitetet` og legge Geoversitetet inn i global navigasjon eller
Riksarkivet.

## Akademisk maskineri v2

Den lokale prototypen er utvidet med komplett før-Vercel-struktur:

- grader og studieprogresjon
- eksamener og muntlig Latvia-forsvar
- institusjonelle organer og riksarkiv
- geofessorprofiler
- Annales Geotiae
- feltmanual for kandidater under kartpress

Alt er fortsatt lokalt under `_lokalt/geoversitetet/`. Ingenting er flyttet inn
i `src/app`, `public/` eller Vercel-flyten.
