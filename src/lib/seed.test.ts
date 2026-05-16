import { describe, expect, it } from "vitest";

import { archive, parties } from "@/lib/seed";

describe("Geotia canon seed", () => {
  it("contains the required Geotia canon from the workbook and notes", () => {
    const serialized = JSON.stringify({ archive, parties });
    const requiredPhrases = [
      "Folk: Geoter",
      "Nasjonalideologi: Geotisme",
      "SAKER FOR GEOTINGET",
      "Geopagos",
      "neplvenidppengeei og al",
      "Gjør din plikt, krev din rett Geoter",
      "geomentarikerne",
      "Alle land deles i tre både vertikalt og horisontalt",
      "Himmelretninger er et område, ikke et punkt",
      "Kattometeret",
      "Sarajevodagen",
      "Å ta en India",
      "Å ta en El Tari",
      "Gule skilter bak og hvite foran - UK",
      "Australia har svette trær",
      "Gule svenske blokker er mest sannsynlig Malmö",
      "Kamtsjatkahalvøyen",
      "Petit verdot er en drue",
      "Obergruppenführer Alf Kåre Dalsbø",
      "Machtsteuerunglebensraum",
      "Pepsi Sjeik Nub Barack av PLO",
      "praesidio constitutionis a morte",
      "Må Orke Spesielle, Slitsomme, Alternative Derivasjoner",
      "Cisrerienserpartiet",
      "JA til nei, og BORT med vekk",
      "KONESPILLET",
      "sexnekt",
      "PLO | IRA | SS | PKK | PWP | CIP | MOSSAD",
    ];

    for (const phrase of requiredPhrases) {
      expect(serialized).toContain(phrase);
    }
  });
});
