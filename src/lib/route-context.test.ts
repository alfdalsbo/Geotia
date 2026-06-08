import { describe, expect, it } from "vitest";

import { getRouteContext, itemMatches, RIKS_NAV_ITEMS, SLOWGEO_SECONDARY_NAV } from "@/lib/route-context";

describe("route context", () => {
  it.each([
    ["/", "home", "Kommandosentral"],
    ["/tabeller", "slowgeo", "Rikets tabeller"],
    ["/runder", "slowgeo", "Fasitarkiv"],
    ["/runder/abc", "slowgeo", "Fasitarkiv"],
    ["/stilling", "slowgeo", "SlowGeo-tabell"],
    ["/hall-of-fame", "slowgeo", "Æreshallen"],
    ["/geotinget/avstemninger", "geotinget", "Stemmeurnen"],
    ["/geotinget/pergamenter", "geotinget", "Tingpergamentene"],
    ["/arkiv/ny-i-geotia", "arkiv", "Ny i Geotia"],
    ["/arkiv/partier", "arkiv", "Arkivseksjon"],
    ["/tredje-kollegium", "min-geot", "Tredje Kollegium"],
    ["/geoversitetet", "min-geot", "Geoversitetet"],
  ])("places %s in the right riksrom", (path, area, pageLabel) => {
    const context = getRouteContext(path);
    expect(context.primary.id).toBe(area);
    expect(context.pageLabel).toBe(pageLabel);
  });

  it("marks SlowGeo's orphan pages as part of the SlowGeo nav family", () => {
    const slowGeo = RIKS_NAV_ITEMS.find((item) => item.id === "slowgeo");
    expect(slowGeo).toBeDefined();
    expect(itemMatches("/tabeller", slowGeo!)).toBe(true);
    expect(itemMatches("/runder/playwright", slowGeo!)).toBe(true);
    expect(itemMatches("/hall-of-fame", slowGeo!)).toBe(true);
  });

  it("keeps the SlowGeo secondary nav active across the family", () => {
    const runder = SLOWGEO_SECONDARY_NAV.find((item) => item.id === "runder");
    const tabeller = SLOWGEO_SECONDARY_NAV.find((item) => item.id === "tabeller");
    expect(runder).toBeDefined();
    expect(tabeller).toBeDefined();
    expect(runder?.label).toBe("Fasitarkiv");
    expect(SLOWGEO_SECONDARY_NAV.find((item) => item.id === "spillrom")?.label).toBe("Spill nå");
    expect(itemMatches("/runder/abc", runder!)).toBe(true);
    expect(itemMatches("/stilling", tabeller!)).toBe(true);
  });
});
