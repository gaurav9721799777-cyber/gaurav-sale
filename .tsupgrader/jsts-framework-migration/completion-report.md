# Migration incomplete

## Outcome

The storefront now uses Next.js Pages Router routes and Next.js navigation. The legacy React Router package and CRA `public/index.html` template have been removed. The app shell renders through the selected Next page rather than a client-only dynamic import, so Next can render page content on the server.

## Evidence

- `npm run build` completed successfully. Next generated the homepage, informational routes, catalog/product/category routes, the admin route, and API routes.
- The built production server returned HTTP 200 for `/`, `/about`, `/product`, `/products`, `/products/category/inverter`, `/order`, `/admin/login`, `/favicon.svg`, and `/manifest.json`.
- Server-rendered HTML for the home, about, products, contact, and admin paths includes the storefront shell and `<main>` content; the homepage and about page include their expected page headings.
- The integrated browser snapshot displayed the Gaurav Sales title and homepage header.
- The full Vitest suite ran 18 tests: 17 passed and 1 failed. The failing delivery-zone distance test was already failing before routing changes.
- Automated browser validation of the admin login route was unavailable because the local Playwright Chromium executable is not installed. The admin route returned 200 and server-rendered its application shell/loading state.
- Standalone runtime-validation timed out during the production-build assertion both before and after migration. The incomplete post-migration artifact is retained at `.tsupgrader/runtime-validation/standalone-result.json`; the build was then run successfully with the repository command and the production HTTP checks were replayed manually.

## Remaining blockers

- The runtime-validation tool did not finish its standalone replay; its required complete persisted result is not available.
- The unrelated delivery-zone test failure must be resolved separately before the entire suite can be considered green.
- Vercel deployment has not been performed. Confirm Vercel uses the Next.js framework preset and default Next.js output settings, then redeploy before the public URL changes.

## Contract changes

| Contract | Source value | Target value | Why required | Alternatives considered | Validation evidence | Approval status |
|---|---|---|---|---|---|---|
| Route owner | React Router client SPA | Next.js Pages Router | Explicit request to make the app fully Next.js | Continue embedding the SPA in Next | Production build and route probes pass | preserved |
| Runtime floor and scripts | Existing Node runtime and `dev`, `build`, `start`, `test` scripts | Unchanged | Next was already the build/deployment framework | Raise runtime or rename scripts | Existing production build and test commands | preserved |
| Deployment framework | Vercel deployment was serving CRA-style HTML | Next.js framework preset, default Next output directory | Prevent Vercel from serving the old static app output | Manually maintain CRA `build/` output | `vercel.json` identifies Next.js; live redeploy still required | approved change |
