<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Geotia Agent Rules

These rules are shared by Codex, Claude Code, and any other coding agent. `CLAUDE.md`
intentionally points here; keep `AGENTS.md` as the canonical agent contract.

## Systemkobling

- Geotia er et fritidsprodukt, ikke et eget person- eller kunnskapsdomene. Repoet eier kode, spilldata, produktlogikk, design og release.
- Ikke utled harde personlighetspåstander fra spilldata, vennemønstre eller produktvalg alene.
- Dersom Alf Kåre eksplisitt avklarer en stabil interesse, arbeidsform eller preferanse med tydelig verdi utover Geotia, kan den promoteres til `alfdalsbo/personlig`; avledede/usikre funn går til personrepoets `context/PROFILKANDIDATER.md`.
- Generaliserbar app-, agent-, spillprodukt- eller leveranselæring vurderes mot `alfdalsbo/arbeidssystem`. Ikke opprett lokal personprofil eller ekstra kontekstarkitektur bare for symmetri.

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
- Push shareable work to GitHub by default. A Git commit is not a deployment request. Vercel is used only when a defined product/runtime input changes or a finished candidate genuinely needs browser/runtime verification.
- Never create a Vercel deployment, Preview or Production release merely as a heartbeat, checkpoint, queue receipt, documentation update or proof that an agent is active.
- Work that must not enter Git belongs in a genuinely ignored local path or an unpushed local branch, not automatically under `_lokalt/`.

## Global app release gate

For GitHub, CI, Vercel or release work, read the latest `alfdalsbo/arbeidssystem/11-app-leveransestandard.md` before the first release-related write and choose a release mode:

1. **No deploy** for proven non-runtime work.
2. **Atomic one-shot publish** for one small coherent low-risk change: gather all affected files first, validate them together, then make one commit/push/publish round.
3. **Iterative branch/draft PR** for expected iteration or broad/risky work: local/agent verification while iterating, one finished Preview candidate only when it adds real browser/runtime signal, final external gate when relevant, then integration to `main`, Production + smoke.

Do not split one logical connector-driven change into multiple `main` pushes. Direct manual production deploy is not the normal source flow when a Git-integrated release path is available. Database/auth/security or irreversible work follows stricter local gates.

### Geotia Vercel transport

Geotia deliberately separates GitHub work from Vercel publication.

- High-frequency work branches such as `codex/**`, `chatgpt/**`, `agent/**`, `research/**`, `docs/**` and related internal branch families are deploy-silent through `vercel.json`.
- Do not try extra pushes when a branch does not create Preview; lack of Preview is normally intentional.
- `scripts/vercel-ignore-build.mjs` owns the positive product boundary for `main`: `src/**`, `public/**`, `content/**` and relevant framework/package/Vercel configuration can trigger a build; docs, `_lokalt/`, GitHub workflows and operational helper scripts do not build by themselves.
- If a finished feature actually needs Preview/browser/runtime verification, create at most one explicit candidate through the configured Vercel tooling. Do not use Vercel as the inner development loop.
- Production should follow integration of a verified product change to `main`, or an explicit recovery request. Never run `vercel --prod` or equivalent for non-product/checkpoint work.
- If a new file outside the current boundary becomes a real build/runtime input, update `scripts/vercel-ignore-build.mjs` and its regression test in the same change.

## Implementation

- Use `npm ci` after cloning so dependencies match `package-lock.json`.
- Prefer existing app patterns, components, tests, and data helpers over new abstractions.
- For visible UI work, verify desktop and mobile behavior with Playwright or a browser check in addition to unit/build checks.

## Verification And Handoff

- For code changes, run `npm run verify` when feasible. It covers lint, TypeScript, unit tests, the Vercel-routing regression test and production build.
- For UI changes, also run `npm run verify:e2e` or a focused Playwright/browser check that covers the changed flow.
- `npm run finish` and `npm run ship` are manual Windows helper scripts. Do not run them unless the user explicitly asks for that workflow.
- Commit and push when the task requires a persistent GitHub change. Broad/risky or iterative changes should use a feature branch and normally a draft PR rather than rewriting `main` blindly.
- Never assume Preview or Production is complete without checking actual Vercel state when a deployment was genuinely required.
- Non-product work that passes the product-boundary test is complete when GitHub state and relevant checks are correct; it must not wait for Vercel.
- In the final handoff, always list changed files, checks run with outcomes, and any open risks or skipped verification.
