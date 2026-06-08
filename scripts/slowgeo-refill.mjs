#!/usr/bin/env node
import {
  candidateFilePath,
  getPoolStats,
  readCandidates,
  readUsedHistory,
  refillCandidates,
  writeCandidates,
} from "./slowgeo-pool-utils.mjs";

const candidates = await readCandidates();
const usedHistory = await readUsedHistory();
const before = getPoolStats(candidates, usedHistory);

console.log(`SlowGeo candidate file: ${candidateFilePath()}`);
console.log(`Before: ${before.unusedCandidateCount} unused of ${before.totalCandidates} total (${before.status}).`);

const result = await refillCandidates({ candidates, usedHistory });
if (!result.changed) {
  console.log(`No refill needed: ${result.reason}.`);
  process.exit(0);
}

await writeCandidates(result.candidates);
console.log(`Added ${result.added.length} SlowGeo candidates.`);
console.log(`After: ${result.stats.unusedCandidateCount} unused of ${result.stats.totalCandidates} total (${result.stats.status}).`);
