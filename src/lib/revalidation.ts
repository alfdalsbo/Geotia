import { revalidatePath } from "next/cache";

const SCOREBOARD_PATHS = ["/", "/spill", "/tabeller", "/stilling", "/hall-of-fame", "/min-geot"];
const GEOTING_PATHS = ["/", "/geotinget", "/geotinget/avstemninger", "/geotinget/pergamenter"];
const GEOTING_ADMIN_PATHS = ["/tredje-kollegium", ...GEOTING_PATHS, "/arkiv/geotinget"];

function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidateRoundPaths(roundId?: string) {
  revalidatePaths([...SCOREBOARD_PATHS, "/runder", ...(roundId ? [`/runder/${roundId}`] : [])]);
}

export function revalidateSlowGeoPaths(roundId?: string) {
  revalidatePaths([...SCOREBOARD_PATHS, "/spill/slowgeo", "/runder", ...(roundId ? [`/runder/${roundId}`] : [])]);
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
  revalidatePaths(["/tredje-kollegium", "/ordenen", "/"]);
}
