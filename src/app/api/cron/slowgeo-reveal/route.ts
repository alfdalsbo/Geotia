import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { revealDueSlowGeoRounds } from "@/lib/store";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await revealDueSlowGeoRounds();
  revalidatePath("/");
  revalidatePath("/runder");
  revalidatePath("/stilling");
  revalidatePath("/hall-of-fame");
  revalidatePath("/min-geot");

  return NextResponse.json({ ok: true, ...result });
}
