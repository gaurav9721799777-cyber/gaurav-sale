# Gaurav Sales

Gaurav Sales is a Next.js storefront and admin application with a MongoDB-backed API. It includes product browsing and search, a cart and checkout, product and category management, order tracking, and admin tools.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `ADMIN_SESSION_SECRET` and `ADMIN_BOOTSTRAP_TOKEN` to different random values of at least 32 characters.
3. Start a local MongoDB server, or set `MONGODB_URI` to a MongoDB Atlas connection string. By default, local development uses the `gaurav-sales-dev` database.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

`MONGODB_URI` accepts both local `mongodb://` and Atlas `mongodb+srv://` connection strings. `APP_ENV` selects the default database: `local` and `dev` use `gaurav-sales-dev`, while `production` uses `gaurav-sales-prod`. Set `MONGODB_DATABASE` when you need a separate database name. Server-side credentials belong in `.env.local` or the deployment provider's environment settings, never in `NEXT_PUBLIC_*` variables.

## Vercel deployment

Import the repository into Vercel and add these server-only environment variables to the appropriate Vercel environments:

- `APP_ENV=production`
- `MONGODB_URI` with the production MongoDB Atlas connection string
- `ADMIN_SESSION_SECRET` and `ADMIN_BOOTSTRAP_TOKEN`, each a different random value of at least 32 characters

Connect a Vercel Blob store to the project to enable persistent product image uploads. Vercel provides `BLOB_READ_WRITE_TOKEN` to the deployment. Local development stores uploaded images in `public/uploads/products`; Vercel stores them in Blob so uploads survive serverless deployments.

The application uses same-origin `/api` routes by default, so a separate `NEXT_PUBLIC_API_URL` is not required. Vercel builds with `npm run build`; run the same command locally to check a production build. After deployment, checkout geolocation requires HTTPS.

## Initial admin setup

Create the first administrator by sending a `POST` request to `/api/auth/bootstrap` with JSON:

```json
{
  "username": "your-admin-name",
  "password": "a-long-unique-password",
  "token": "your-bootstrap-token"
}
```

The endpoint is available only until the first administrator is created. Admin sign-in uses `/api/auth/admin`; passwords are stored as salted scrypt hashes, and admin sessions use signed, HTTP-only cookies.

## Commands

- `npm run dev`: start the local development server
- `npm run build`: create the optimized production build
- `npm start`: serve the production build locally
- `npm test`: run the test suite
