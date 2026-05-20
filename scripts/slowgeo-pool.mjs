#!/usr/bin/env node
import { candidateFilePath, getPoolStats, readCandidates, readUsedHistory } from "./slowgeo-pool-utils.mjs";

const candidates = await readCandidates();
const usedHistory = await readUsedHistory();
const stats = getPoolStats(candidates, usedHistory);

console.log(`SlowGeo candidate file: ${candidateFilePath()}`);
console.log(`Status: ${stats.status}`);
console.log(`Total candidates: ${stats.totalCandidates}`);
console.log(`Unused candidates: ${stats.unusedCandidateCount}`);
console.log(`Used candidate IDs: ${stats.usedCandidateCount}`);
console.log(`Used pano IDs: ${stats.usedPanoCount}`);
console.log(`Low watermark: ${stats.lowWatermark}`);
console.log(`Target unused: ${stats.targetUnused}`);
console.log("By continent:");
for (const [continent, count] of Object.entries(stats.byContinent).sort(([a], [b]) => a.localeCompare(b))) {
  console.log(`  ${continent}: ${count}`);
}
