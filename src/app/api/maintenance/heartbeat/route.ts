import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth";
import { revalidateGeoticOrderPaths, revalidateGeotingAdminPaths, revalidateSlowGeoPaths } from "@/lib/revalidation";
import { runInteractiveMaintenance } from "@/lib/store";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runInteractiveMaintenance();
    if ((result?.slowGeo.revealed ?? 0) > 0) {
      revalidateSlowGeoPaths();
    }
    if ((result?.geoting.resolved ?? 0) > 0) {
      revalidateGeotingAdminPaths();
    }
    if ((result?.geoticOrderPromotionCases ?? 0) > 0) {
      revalidateGeoticOrderPaths();
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Vedlikeholdet er midlertidig utilgjengelig." }, { status: 503 });
  }
}
