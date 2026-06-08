import { readFile } from "node:fs/promises";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import { isThirdCollegeMember } from "@/lib/kollegium";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = await cookies();
  const session = verifyToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session || !isThirdCollegeMember(session.playerId)) {
    return new NextResponse(null, { status: 404 });
  }

  const image = await readFile(new URL("./tredje-kollegium.jpeg", import.meta.url));

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": "image/jpeg",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
