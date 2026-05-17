import { readdir, rm } from "node:fs/promises";
import path from "node:path";

export default async function globalSetup() {
  const dataDir = path.join(process.cwd(), ".data");
  const entries = await readdir(dataDir).catch(() => []);
  await Promise.all(
    entries
      .filter((entry) => entry.startsWith("playwright-geotia.json"))
      .map((entry) => rm(path.join(dataDir, entry), { force: true })),
  );
}
