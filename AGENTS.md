<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Geotia Agent Rules

These rules are shared by Codex, Claude Code, and any other coding agent. `CLAUDE.md`
intentionally points here; keep `AGENTS.md` as the canonical agent contract.

## Workspace

- Work from this repository root. If you are opened in the parent folder, the active app workspace is `geotia-web`.
- Treat `main` as the shared canonical base unless the user explicitly names another branch.
- `geo-design-v2` is an older diverging development branch, not the default base. Do not merge, delete, or resurrect it implicitly; compare deliberately if old work there becomes relevant.
- Treat `geotia-web-f7-clean` as a local reference/worktree only, not as the onboarding workspace for collaborators.
- Do not edit source documents or assets in the parent folder (`.docx`, `.xlsx`, images, videos, or local agent settings) unless the user explicitly asks.

## Collaboration

- Before changing files, run `git status --short --branch` and note existing changes so user work is not overwritten.
- For collaborative work, fetch and fast-forward `main` before branching when auth is available: `git fetch origin` followed by `git pull --ff-only`.
- Create feature branches from updated `main` with a clear prefix such as `codex/`, `claude/`, `agent/` or `human/`.
- Never revert, overwrite, or reformat unrelated changes that you did not make.
- Keep genuinely machine-local files local: `.env.local`, `.data/`, `.vercel/`, `.next/`, `node_modules/`, test artifacts, and editor caches.
- `_lokalt/` is different: despite the name it is version-controlled, non-deployed prototype/archive content. Preserve it in Git when it is part of the intended archive; do not use it as a generic ignored scratch directory.
- Publish shareable changes to Vercel by default. Use a preview deployment for feature/WIP branches and production only through the configured production flow or an explicit recovery request.
- Work that must not enter Git belongs in a genuinely ignored local path or an unpushed local branch, not automatically under `_lokalt/`.

## Global app release gate

For GitHub, CI, Vercel or release work, read the latest `alfdalsbo/arbeidssystem/11-app-leveransestandard.md` before the first release-related write and choose a release mode:

1. **No deploy** for proven non-runtime work.
2. **Atomic one-shot publish** for one small coherent low-risk change: gather all affected files first, validate them together, then make one commit/push/publish round.
3. **Iterative branch/draft PR** for expected iteration or broad/risky work: local/agent verification and Vercel Preview while iterating, final external CI only when the PR is ready, then merge and Production + smoke.

Do not split one logical connector-driven change into multiple `main` pushes. Direct manual Vercel production deploy is not the normal source flow. Database/auth/security or irreversible work follows stricter local gates.

## Implementation

- Use `npm ci` after cloning so dependencies match `package-lock.json`.
- Prefer existing app patterns, components, tests, and data helpers over new abstractions.
- For visible UI work, verify desktop and mobile behavior with Playwright or a browser check in addition to unit/build checks.

## Verification And Handoff

- For code changes, run `npm run verify` when feasible. It covers lint, TypeScript, unit tests, and production build.
- For UI changes, also run `npm run verify:e2e` or a focused Playwright/browser check that covers the changed flow.
- `npm run finish` and `npm run ship` are manual Windows helper scripts. Do not run them unless the user explicitly asks for that workflow.
- Commit and push when the task requires a persistent GitHub change. Broad/risky or iterative changes should use a feature branch and normally a draft PR rather than rewriting `main` blindly.
- Vercel Git integration owns Preview from branch/PR and Production from `main`; never assume either is complete without checking actual Vercel state.
- Pure docs, `.github` and `_lokalt/` changes may be skipped by Vercel through the fail-safe `ignoreCommand`; runtime-affecting files must still build.
- In the final handoff, always list changed files, checks run with outcomes, and any open risks or skipped verification.
