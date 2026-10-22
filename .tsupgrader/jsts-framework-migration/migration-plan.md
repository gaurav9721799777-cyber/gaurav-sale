# Framework migration plan

## Route migration path

- Source: `src/App.tsx` + `src/Route/AppRoutes.tsx` using React Router.
- Target: `pages/` filesystem routes with shared Next custom App and Next router.

## Dependency-ordered work

| Item | Source evidence | Target design | Dependencies | Validation | Status |
|---|---|---|---|---|---|
| Baseline | Source tree and standalone runtime-validation plan | Record source build/test results and known failures | None | Standalone attempt timed out during build; earlier source build succeeded; 17/18 tests passed | Source baseline blocked; recorded |
| Next app bootstrap | `_app.tsx` ignored page component; catch-all returned null | Render the page component from Next; retain theme, styles and metadata | Baseline | `npm run build`; homepage browser snapshot | Complete |
| Shared app shell | `src/App.tsx` used BrowserRouter and read localStorage during render | Use Next router and initialize cart storage after hydration | Next app bootstrap | TypeScript check within production build; app tests | Complete |
| Public route families | `src/Route/AppRoutes.tsx` mapped home, catalog, dynamic product/category, info, and checkout pages | Add Pages Router route files and preserve route/query behavior | Shared app shell | Build route table; HTTP checks for home, about, products, contact and order | Complete |
| Admin routes | React Router admin guard and subsection handling | Preserve admin login and subsection paths through Next route files | Shared app shell | `/admin/login` HTTP check and page shell render | Complete; client browser automation unavailable |
| Framework cleanup | React Router imports and runtime package | Remove React Router after route migration | All route families | Source scan clean; lockfile updated; build succeeds | Complete |
| Production verification | Next `build`/`start` and Vercel deployment | Verify built routes/assets; leave deploy to user | All prior items | Build succeeded; representative paths/assets returned 200 and rendered server markup; standalone replay pending | Partial |

## Contract changes

| Contract | Source value | Target value | Why required | Alternatives considered | Validation evidence | Approval status |
|---|---|---|---|---|---|---|
| Routes/navigation | React Router inside a client-only shell | Next Pages Router | User requested fully Next.js and direct page rendering currently fails | Leave React Router as application router | Build route table and direct HTTP/SSR checks | preserved |
| Commands/runtime floor | `dev`, `build`, `start`, and `test`; installed Node runtime | Keep scripts and runtime unchanged | Framework already uses Next scripts; no runtime raise needed | Change scripts/toolchain | Existing scripts and lockfile | preserved |
| Runtime dependencies | `react-router-dom` required by app | Removed | No React Router should remain in target | Keep dependency unused | Removed from package and lockfile; source scan is clean; production build passes | preserved |

## Approval gate

Do not remove the source routing dependency or claim cutover complete until the target routes and existing behavior pass validation. Keep deployment changes user-controlled; deploying to Vercel is outside this repository migration.
