# Contributing To Geotia

Geotia should be easy to work on from Codex, Claude Code, or a normal editor.
Use GitHub as the shared source of truth; do not share a raw copy of the whole
local workspace.

## First Setup

```bash
git clone https://github.com/alfdalsbo/Geotia.git
cd Geotia
git switch geo-design-v2
npm ci
```

Create a local `.env.local` from `.env.example` and fill in any private values
you need for the task. Keep `.env.local` private.

```powershell
Copy-Item .env.example .env.local
```

```bash
cp .env.example .env.local
```

Start the app locally:

```bash
npm run dev
```

## Daily Workflow

Before starting new work:

```bash
git fetch origin
git switch geo-design-v2
git pull --ff-only
git switch -c codex/short-description
```

Use a branch prefix that matches the worker: `codex/`, `claude/`, or `human/`.
Keep each branch focused on one task.

## Publishing Rule

Changes that are meant to be shared or reviewed should be published to Vercel by
default unless the task says otherwise. For feature and WIP work, publish a
Vercel preview from the branch. Production deploys happen only from the
configured production branch or after an explicit production-deploy request.

If work must stay private or unfinished, keep it in `_lokalt/` or on an
unpushed local branch and label it as local-only in handoff notes.

## What Stays Local

Do not copy or commit machine-specific state:

- `.git/` when sharing folders outside GitHub
- `node_modules/`
- `.next/`, `.vercel/`, `.data/`, `.artifacts/`, `test-results/`, `_lokalt/`
- `.env.local` or any real secrets
- local editor or agent settings

The parent folder may contain source documents, spreadsheets, images, and video
assets used as references. Treat those as source material and leave them alone
unless the task explicitly asks for a change there.

## Verification

For normal code changes:

```bash
npm run verify
```

For visible UI changes, also run Playwright or a focused browser check:

```bash
npm run verify:e2e
```

Agents should report changed files, checks run, deployments created, and
remaining risks. Publishing delegated to an agent means a Vercel preview unless
production is explicitly requested.
