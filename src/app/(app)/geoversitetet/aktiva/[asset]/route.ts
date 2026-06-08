import { readFile } from "node:fs/promises";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { COOKIE_NAME, verifyToken } from "@/lib/auth";
import {
  canViewGeoversitetet,
  getGeoversitetetAsset,
} from "@/lib/geoversitetet";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string }> },
) {
  const cookieStore = await cookies();
  const session = verifyToken(cookieStore.get(COOKIE_NAME)?.value);
  if (!session || !canViewGeoversitetet(session.playerId)) {
    return new NextResponse(null, { status: 404 });
  }

  const { asset: assetName } = await params;
  const asset = getGeoversitetetAsset(assetName);
  if (!asset) {
    return new NextResponse(null, { status: 404 });
  }

  const image = await readGeoversitetetAsset(assetName);

  return new NextResponse(new Uint8Array(image), {
    headers: {
      "Cache-Control": "private, max-age=300",
      "Content-Type": asset.contentType,
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}

function readGeoversitetetAsset(assetName: string) {
  switch (assetName) {
    case "geoversitetet-logo.jpeg":
      return readFile(new URL("./assets/geoversitetet-logo.jpeg", import.meta.url));
    case "oyologi-kunngjoring.jpeg":
      return readFile(new URL("./assets/oyologi-kunngjoring.jpeg", import.meta.url));
    case "geofessor-steinar-lofnes.png":
      return readFile(new URL("./assets/geofessor-steinar-lofnes.png", import.meta.url));
    case "geofessor-alf-kare-dalsbo.png":
      return readFile(new URL("./assets/geofessor-alf-kare-dalsbo.png", import.meta.url));
    case "geofessor-vegard-lofnes.png":
      return readFile(new URL("./assets/geofessor-vegard-lofnes.png", import.meta.url));
    case "geofessor-sverre-skilbreid.png":
      return readFile(new URL("./assets/geofessor-sverre-skilbreid.png", import.meta.url));
    default:
      throw new Error(`Ukjent Geoversitetet-asset: ${assetName}`);
  }
}
