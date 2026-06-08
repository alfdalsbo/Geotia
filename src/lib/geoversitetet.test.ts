import { describe, expect, it } from "vitest";

import {
  canViewGeoversitetet,
  geoversitetetCatalog,
  getGeoversitetetAsset,
} from "@/lib/geoversitetet";

describe("Geoversitetet", () => {
  it("is initially visible only to Tredje Kollegium", () => {
    expect(canViewGeoversitetet("alf")).toBe(true);
    expect(canViewGeoversitetet("steinar")).toBe(true);
    expect(canViewGeoversitetet("vegard")).toBe(true);

    expect(canViewGeoversitetet("sverre")).toBe(false);
    expect(canViewGeoversitetet("danny")).toBe(false);
    expect(canViewGeoversitetet(null)).toBe(false);
  });

  it("publishes the local Geoversitetet canon in app-safe data", () => {
    expect(geoversitetetCatalog.navn).toBe("Geoversitetet");
    expect(geoversitetetCatalog.diplomarkiv).toHaveLength(4);
    expect(geoversitetetCatalog.fakulteter.length).toBeGreaterThanOrEqual(5);
    expect(geoversitetetCatalog.grader.map((grad) => grad.kode)).toContain("doctor pinnae");
    expect(geoversitetetCatalog.organer.map((organ) => organ.navn)).toContain("Senatus Academicus");
    expect(geoversitetetCatalog.annales.navn).toBe("Annales Geotiae");
    expect(geoversitetetCatalog.feltmanual.map((regel) => regel.regel)).toContain("Se først, gjett senere");
  });

  it("keeps protected assets on the Geoversitetet asset allowlist", () => {
    expect(getGeoversitetetAsset("geoversitetet-logo.jpeg")?.contentType).toBe("image/jpeg");
    expect(getGeoversitetetAsset("geofessor-steinar-lofnes.png")?.contentType).toBe("image/png");
    expect(getGeoversitetetAsset("../fagkatalog.json")).toBeNull();
  });
});
