import { revalidatePath } from "next/cache";

const ROUND_SUMMARY_PATHS = ["/", "/tabeller", "/stilling", "/hall-of-fame", "/min-geot"];
const SLOWGEO_PATHS = ["/", "/spill", "/spill/slowgeo", "/tabeller", "/stilling", "/hall-of-fame", "/min-geot", "/runder"];
const GEOTING_PATHS = ["/", "/geotinget", "/geotinget/avstemninger", "/geotinget/pergamenter"];
const GEOTING_ADMIN_PATHS = ["/tredje-kollegium", ...GEOTING_PATHS, "/arkiv/geotinget"];

type RevalidationDomainEvent = "rounds" | "slowgeo" | "gameSessions" | "geoting" | "geotingAdmin" | "thirdCollege" | "order" | "profiles";

const REVALIDATION_PATHS: Record<RevalidationDomainEvent, string[]> = {
  rounds: [...ROUND_SUMMARY_PATHS, "/runder"],
  slowgeo: SLOWGEO_PATHS,
  gameSessions: ["/", "/spill", "/spill/registrer", "/tabeller", "/min-geot"],
  geoting: GEOTING_PATHS,
  geotingAdmin: GEOTING_ADMIN_PATHS,
  thirdCollege: ["/tredje-kollegium"],
  order: ["/tredje-kollegium", "/ordenen", "/min-geot", "/geotinget", "/geotinget/avstemninger", "/"],
  profiles: [
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
  ],
};

function revalidatePaths(paths: string[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

export function revalidateDomainEvent(event: RevalidationDomainEvent, extraPaths: string[] = []) {
  revalidatePaths([...REVALIDATION_PATHS[event], ...extraPaths]);
}

export function revalidateRoundPaths(roundId?: string) {
  revalidateDomainEvent("rounds", roundId ? [`/runder/${roundId}`] : []);
}

export function revalidateSlowGeoPaths(roundId?: string) {
  revalidateDomainEvent("slowgeo", roundId ? [`/runder/${roundId}`, `/slowgeo/${roundId}`] : []);
}

export function revalidateGameSessionPaths() {
  revalidateDomainEvent("gameSessions");
}

export function revalidateGeotingPaths() {
  revalidateDomainEvent("geoting");
}

export function revalidateGeotingAdminPaths() {
  revalidateDomainEvent("geotingAdmin");
}

export function revalidateThirdCollegePaths() {
  revalidateDomainEvent("thirdCollege");
}

export function revalidateGeoticOrderPaths() {
  revalidateDomainEvent("order");
}

export function revalidatePlayerProfilePaths() {
  revalidateDomainEvent("profiles");
}
