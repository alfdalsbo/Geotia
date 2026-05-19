<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Geotia Agent Rules

These rules are shared by Codex, Claude Code, and any other coding agent. `CLAUDE.md`
intentionally points here; keep `AGENTS.md` as the canonical agent contract.

## Workspace

- Work from this repository root. If you are opened in the parent folder, the
  active app workspace is `geotia-web`.
- Treat `geo-design-v2` as the shared base branch unless the user explicitly
  names another branch.
- Treat `geotia-web-f7-clean` as a local reference/worktree only, not as the
  onboarding workspace for collaborators.
- Do not edit source documents or assets in the parent folder (`.docx`, `.xlsx`,
  images, videos, or local agent settings) unless the user explicitly asks.

## Collaboration

- Before changing files, run `git status --short --branch` and note existing
  changes so user work is not overwritten.
- For collaborative work, fetch and fast-forward before branching when auth is
  available: `git fetch origin` followed by `git pull --ff-only`.
- Create feature branches from `geo-design-v2` with a clear prefix such as
  `codex/`, `claude/`, or `human/`.
- Never revert, overwrite, or reformat unrelated changes that you did not make.
- Keep machine-local files local: `.env.local`, `.data/`, `.vercel/`, `.next/`,
  `node_modules/`, test artifacts, and editor caches.

## Implementation

- Use `npm ci` after cloning so dependencies match `package-lock.json`.
- Prefer existing app patterns, components, tests, and data helpers over new
  abstractions.
- For visible UI work, verify desktop and mobile behavior with Playwright or a
  browser check in addition to unit/build checks.

## Verification And Handoff

- For code changes, run `npm run verify` when feasible. It covers lint, unit
  tests, and production build.
- For UI changes, also run `npm run verify:e2e` or a focused Playwright/browser
  check that covers the changed flow.
- `npm run finish` and `npm run ship` are manual Windows helper scripts. Do not
  run them unless the user explicitly asks for that workflow.
- Do not commit, push, or deploy unless the user explicitly asks.
- In the final handoff, always list changed files, checks run with outcomes, and
  any open risks or skipped verification.
