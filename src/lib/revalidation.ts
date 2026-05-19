import { revalidatePath } from "next/cache";

const ROUND_SUMMARY_PATHS = ["/", "/tabeller", "/stilling", "/hall-of-fame", "/min-geot"];
const SLOWGEO_PATHS = ["/", "/spill", "/spill/slowgeo", "/tabeller", "/stilling", "/hall-of-fame", "/min-geot", "/runder"];
const GEOTING_PATHS = ["/", "/geotinget", "/geotinget/avstemninger", "/geotinget/pergamenter"];
const GEOTING_ADMIN_PATHS = ["/tredje-kollegium", ...GEOTING_PATHS, "/arkiv/geotinget"];

function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidateRoundPaths(roundId?: string) {
  revalidatePaths([...ROUND_SUMMARY_PATHS, "/runder", ...(roundId ? [`/runder/${roundId}`] : [])]);
}

export function revalidateSlowGeoPaths(roundId?: string) {
  revalidatePaths([...SLOWGEO_PATHS, ...(roundId ? [`/runder/${roundId}`, `/slowgeo/${roundId}`] : [])]);
}

export function revalidateGameSessionPaths() {
  revalidatePaths(["/", "/spill", "/spill/registrer", "/tabeller", "/min-geot"]);
}

export function revalidateGeotingPaths() {
  revalidatePaths(GEOTING_PATHS);
}

export function revalidateGeotingAdminPaths() {
  revalidatePaths(GEOTING_ADMIN_PATHS);
}

export function revalidateThirdCollegePaths() {
  revalidatePaths(["/tredje-kollegium"]);
}

export function revalidateGeoticOrderPaths() {
  revalidatePaths(["/tredje-kollegium", "/ordenen", "/min-geot", "/geotinget", "/geotinget/avstemninger", "/"]);
}

export function revalidatePlayerProfilePaths() {
  revalidatePaths([
    "/",
    "/min-geot",
    "/tabeller",
    "/stilling",
    "/hall-of-fame",
    "/runder",
    "/spill/slowgeo",
    "/geotinget",
    "/geotinget/avstemninger",
    "/geotinget/pergamenter",
    "/ordenen",
    "/tredje-kollegium",
  ]);
}
