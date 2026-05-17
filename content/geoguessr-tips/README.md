# GeoGuessr-tipsbank

Lokal fase-1-samling for Geotia. Denne mappen er kun research og innhold; ingenting her er koblet inn i appen eller publisert.

## Filer

- `tips.json` er den kanoniske, maskinlesbare tipsbanken som senere kan brukes til hint, kort, landprofiler, daglige tips, quiz eller loading-tekster.
- `tips-by-category.md` er en lesbar oversikt over de viktigste mønstrene.
- `sources.md` beskriver kildene som ble brukt da tipsene ble samlet inn.

## Datamodell

Hvert tips i `tips.json` har:

- `id`: stabil nøkkel.
- `title`: kort tittel for UI.
- `body`: selve tipset på norsk.
- `category`: hovedkategori, f.eks. `license-plates`, `road-markings`, `google-car`, `language`, `country-clues`.
- `countries`: land tipset peker mot, tom liste når tipset er globalt.
- `regions`: bredere område.
- `difficulty`: `basic`, `intermediate` eller `advanced`.
- `confidence`: hvor sterkt tipset normalt er.
- `tags`: søkeord for filtrering senere.
- `sourceRefs`: kildenøkler som peker til `sources` i samme JSON og til `sources.md`.

## Merk

GeoGuessr-meta endrer seg når Google oppdaterer Street View-dekning. Bilmeta, kameragenerasjoner og overrepresenterte World Map-lokasjoner bør derfor behandles som mer ferskvare enn språk, skilt, veilinjer, stolper og landskap.
