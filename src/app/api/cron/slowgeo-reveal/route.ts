import { NextResponse } from "next/server";

import { revalidateGeoticOrderPaths, revalidateGeotingAdminPaths, revalidateSlowGeoPaths } from "@/lib/revalidation";
import { runScheduledMaintenance } from "@/lib/store";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await runScheduledMaintenance();
  if (result.slowGeo.revealed > 0) {
    revalidateSlowGeoPaths();
  }
  if (result.geoting.resolved > 0) {
    revalidateGeotingAdminPaths();
  }
  if (result.geoticOrderPromotionCases > 0) {
    revalidateGeoticOrderPaths();
  }

  return NextResponse.json({ ok: true, ...result });
}
