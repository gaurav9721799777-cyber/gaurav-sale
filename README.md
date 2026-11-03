# Gaurav Sales

Gaurav Sales is a Next.js storefront and admin application with a MongoDB-backed API. It includes product browsing and search, a cart and checkout, product and category management, order tracking, and admin tools.

## Local development

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` and set `ADMIN_SESSION_SECRET` and `ADMIN_BOOTSTRAP_TOKEN` to different random values of at least 32 characters.
3. Start a local MongoDB server, or set `MONGODB_URI` to a MongoDB Atlas connection string. By default, local development uses the `gaurav-sales-dev` database.
4. Run `npm run dev` and open [http://localhost:3000](http://localhost:3000).

`MONGODB_URI` accepts both local `mongodb://` and Atlas `mongodb+srv://` connection strings. `APP_ENV` selects the default database: `local` and `dev` use `gaurav-sales-dev`, while `production` uses `gaurav-sales-prod`. Set `MONGODB_DATABASE` when you need a separate database name. Server-side credentials belong in `.env.local` or the deployment provider's environment settings, never in `NEXT_PUBLIC_*` variables.

## Vercel deployment

Import the repository into Vercel with the **Next.js** framework preset and add these server-only environment variables to the appropriate Vercel environments. Keep Vercel's default Next.js output settings; do not set the output directory to `build` (that is not the Next.js production output).

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

## Dealer sales

Sign in to the admin panel and open **Dealer sales**. Register the dealer, then create a dealer sale when products are handed over. Each sale records editable dealer prices and deducts the handed-over quantities from stock. You can record an initial payment or leave the balance due, then record later payments from the dealer ledger. The ledger shows each dealer's outstanding balance and can print an invoice showing the total, payments received, and amount due.

Website checkout remains the individual-customer flow and uses the existing retail product prices. Dealer transactions are kept separate from individual customer orders.

## Gmail order confirmations

After an individual checkout order is saved, the app sends an order confirmation to the email address entered at checkout. Email is optional; if the customer leaves it blank, no email can be sent. Configure `GMAIL_USER` and `GMAIL_APP_PASSWORD` in local `.env.local` or the deployment environment. Create a Google App Password for the sending Gmail account (2-Step Verification must be enabled); use the App Password, not the account password. Keep both values server-side and never expose them as `NEXT_PUBLIC_*` variables. If Gmail is not configured or delivery fails, the order remains saved and checkout shows a notification.

## Commands

- `npm run dev`: start the local development server
- `npm run build`: create the optimized production build
- `npm start`: serve the production build locally
- `npm test`: run the test suite
