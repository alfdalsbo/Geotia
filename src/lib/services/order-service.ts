import {
  addGeoterIndexAdjustment as addGeoterIndexAdjustmentCore,
  runInteractiveMaintenance as runInteractiveMaintenanceCore,
  runScheduledMaintenance as runScheduledMaintenanceCore,
  syncGeoticOrderPromotionCases as syncGeoticOrderPromotionCasesCore,
  upsertGeoticOrderAssessment as upsertGeoticOrderAssessmentCore,
  voteGeoticOrderPromotionCase as voteGeoticOrderPromotionCaseCore,
} from "@/lib/data/geotia-store";
import { withDataMutationLock } from "@/lib/data/mutation-lock";

export function addGeoterIndexAdjustment(...args: Parameters<typeof addGeoterIndexAdjustmentCore>) {
  return withDataMutationLock("order", () => addGeoterIndexAdjustmentCore(...args));
}

export function syncGeoticOrderPromotionCases(...args: Parameters<typeof syncGeoticOrderPromotionCasesCore>) {
  return withDataMutationLock("order", () => syncGeoticOrderPromotionCasesCore(...args));
}

export function upsertGeoticOrderAssessment(...args: Parameters<typeof upsertGeoticOrderAssessmentCore>) {
  return withDataMutationLock("order", () => upsertGeoticOrderAssessmentCore(...args));
}

export function voteGeoticOrderPromotionCase(...args: Parameters<typeof voteGeoticOrderPromotionCaseCore>) {
  return withDataMutationLock("order", () => voteGeoticOrderPromotionCaseCore(...args));
}

export function runScheduledMaintenance(...args: Parameters<typeof runScheduledMaintenanceCore>) {
  return withDataMutationLock("scheduled-maintenance", () => runScheduledMaintenanceCore(...args));
}

export function runInteractiveMaintenance(...args: Parameters<typeof runInteractiveMaintenanceCore>) {
  return runInteractiveMaintenanceCore(...args);
}
