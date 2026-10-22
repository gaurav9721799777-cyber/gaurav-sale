# Framework migration inventory

## Scope

- Source: Create React App-style client application with React Router; the historical CRA production output remains in ignored `build/`.
- Current/target framework: Next.js 16 Pages Router, in the repository root.
- Package: repository root (`package.json`).
- Migration target: remove the React Router/client-only shell dependency and use Next.js filesystem routes and navigation while preserving the existing storefront and API behavior.

## Current framework inventory

- Next.js is installed and owns the development, production build, start, API, and Vercel commands.
- `pages/_app.tsx` currently ignores Next's page component and dynamically imports `src/App.tsx` with server rendering disabled.
- `pages/[[...slug]].tsx` matches public routes but renders `null`; it does not provide the storefront.
- `src/App.tsx` owns the shared header/footer, cart and authentication state, and embeds the application in `BrowserRouter`.
- `src/Route/AppRoutes.tsx` owns the public, catalog, product-detail, checkout, and admin route table.
- Route families: home (1); catalog/search and catalog filters (7 fixed variants plus category and product dynamic paths); informational pages (5); order (1); admin login and protected admin subsections (1 login plus 6 subsections). Next API routes remain under `pages/api/`.
- Content components are under `src/pages/` (Home, Products, About, Contact, FAQ, Order, Shipping, Payment) and `src/components/` (Product details and Admin).
- Global CSS and Mantine imports are wired in `pages/_app.tsx`; user assets are in `public/` and `src/assets/`.
- Existing test command is `npm test` (Vitest); existing tests cover the application shell, products, contact, and delivery-zone logic.
- Deployment uses the Next.js production output; README directs Vercel to `npm run build`.

## Baseline status

The source baseline is classified `source-baseline-blocked`: the standalone runtime-validation build timed out before completing its first run. A prior local production build on the source state succeeded, and a source-state test run reported 17 passing and 1 failing test (`src/server/delivery-zone.test.ts`: one coordinate expected inside the 4 km radius was rejected). That failure is independent of routing and remains visible; the incomplete standalone artifact is retained as evidence.

## Contract changes

| Contract | Source value | Target value | Why required | Alternatives considered | Validation evidence | Approval status |
|---|---|---|---|---|---|---|
| Public route ownership | BrowserRouter route table rendered by client-only app shell | Next.js Pages Router route files; Next router owns navigation | Current Next page component is ignored and catch-all renders nothing | Keep CRA-style SPA inside Next wrapper | Pending build, test, and route probes | preserved |
| Framework runtime/dependencies | Next 16 already runs the production app; React Router is a runtime dependency | Next Pages Router with React Router removed only after parity | Eliminate dual-router architecture | Keep React Router inside a Next shell | Pending dependency and test validation | preserved |
| Shipped user behavior | Storefront, catalog, product details, checkout, admin and API behaviors | Same user-visible behavior on Next routes | User explicitly requested a full Next.js application | Rewrite app or change functionality | Pending route and regression validation | preserved |
