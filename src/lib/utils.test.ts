import { describe, expect, it } from "vitest";

import { dateTimeLabel } from "@/lib/utils";

describe("dateTimeLabel", () => {
  it("formats GeoTinget deadlines in Oslo time", () => {
    expect(dateTimeLabel("2026-05-16T18:50:00.000Z")).toContain("20:50");
  });
});
