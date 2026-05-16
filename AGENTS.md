<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Geotia Workflow

When working in this repository, treat verified shipping as the default:

- Run the relevant checks after code changes, normally `npm run lint`, `npm run test`, `npm run build`, and Playwright/browser verification for visible UI work.
- Commit completed changes locally with a clear Geotia-specific message unless the user explicitly asks not to.
- Deploy successful changes to Vercel production automatically unless the user explicitly asks for a preview-only or local-only change.
- Keep source documents in the workspace root untouched.
