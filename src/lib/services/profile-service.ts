import { updatePlayerProfile as updatePlayerProfileCore } from "@/lib/data/geotia-store";
import { withDataMutationLock } from "@/lib/data/mutation-lock";

export function updatePlayerProfile(...args: Parameters<typeof updatePlayerProfileCore>) {
  return withDataMutationLock("profiles", () => updatePlayerProfileCore(...args));
}
