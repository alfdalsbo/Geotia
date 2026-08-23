import { execFileSync } from 'node:child_process';

// GitHub is the work/state surface. Vercel should build only when the deployed
// product can actually change. Keep this list conservative when a new build
// input is introduced.
export const vercelProductInputs = [
  /^src\//,
  /^public\//,
  /^content\//,
  /^next\.config\.(?:js|mjs|ts)$/,
  /^postcss\.config\.(?:js|mjs|ts)$/,
  /^tsconfig\.json$/,
  /^package(?:-lock)?\.json$/,
  /^vercel\.json$/,
  /^\.nvmrc$/,
  /^\.node-version$/,
];

export function canSkipVercelBuild(changedFiles) {
  return Array.isArray(changedFiles)
    && changedFiles.length > 0
    && changedFiles.every((file) => !vercelProductInputs.some((pattern) => pattern.test(file)));
}

function changedFilesForTriggeringCommit() {
  try {
    return execFileSync('git', ['diff', '--name-only', 'HEAD^', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .split('\n')
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

const invokedAsScript = process.argv[1]?.endsWith('vercel-ignore-build.mjs');
if (invokedAsScript) {
  const changed = changedFilesForTriggeringCommit();
  // Vercel Ignored Build Step: exit 0 = skip, exit 1 = build.
  // Git/history uncertainty must fail safe to a real build.
  process.exit(changed && canSkipVercelBuild(changed) ? 0 : 1);
}
