# Deployment Guide: Render + Vercel + MongoDB Atlas

This guide deploys the Express API on Render and the Next.js frontend on Vercel from the same GitHub repository. You need access to the GitHub repository and accounts on Render, Vercel, and MongoDB Atlas. Provider dashboards and plan limits can change; follow each dashboard's current prompts if labels differ.

## Deployment order

1. Confirm the latest tested code and documentation are pushed to GitHub.
2. Confirm MongoDB Atlas is reachable and has a database user.
3. Deploy the backend to Render and check its health endpoint.
4. Deploy the frontend to Vercel with the Render API URL.
5. Set the exact Vercel origin in Render's CORS variable and redeploy the backend.
6. Create/verify the Admin user and test login, products, sales, inventory, and reports on the public site.

## 1. Prepare MongoDB Atlas

1. Open your Atlas project and cluster.
2. Under Database Access, create or verify a database user with access to the app database. This is separate from your Atlas website login.
3. Copy the cluster connection string from Connect → Drivers. Use it for `MONGODB_URI` and replace the placeholders. URL-encode reserved characters in the database password.
4. Under Network Access, allow the outbound IP addresses required by your Render service. Prefer the smallest practical allowlist. `0.0.0.0/0` allows connections from anywhere and is not recommended for a production database.
5. Keep the connection string private; do not put it in frontend variables or commit it to Git.

## 2. Deploy the backend on Render

1. Open the Render dashboard and choose **New → Web Service**.
2. Connect the GitHub repository `avneeshkumar31311-cyber/retail-inventory-sales`.
3. Configure the service as follows:

| Setting | Value |
|---|---|
| Name | `retailsync-api` (or another available name) |
| Root Directory | `backend` |
| Runtime | Node |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

4. Add these environment variables in the Render service's Environment section:

| Variable | Value |
|---|---|
| `MONGODB_URI` | The private Atlas connection string |
| `JWT_SECRET` | A long, random secret; do not reuse the example value |
| `FRONTEND_URL` | Temporarily `http://localhost:3000`; update after Vercel deploys |
| `SEED_ADMIN_EMAIL` | Email to use for the initial Admin user |
| `SEED_ADMIN_NAME` | Display name for the initial Admin user |
| `SEED_ADMIN_PASSWORD` | Strong initial Admin password; keep private |
| `PORT` | Usually omit; Render provides the port automatically |

5. Start the deployment and inspect the build/runtime logs. When deployment succeeds, open the Render service URL followed by `/api/health`, for example `https://<your-render-service>.onrender.com/api/health`. Use the actual hostname shown in your dashboard; do not use the example literally.

If health fails, inspect Render logs first, then check the start command, `MONGODB_URI`, Atlas access list, and database user credentials.

## 3. Create the initial Admin user

The deployment must have an Admin account before you can sign in. Run the backend's `npm run seed:admin` script once with the intended database and the `SEED_ADMIN_EMAIL`, `SEED_ADMIN_NAME`, and `SEED_ADMIN_PASSWORD` variables configured. You may run it in a supported Render Shell if available for your service, or run it from a trusted local terminal configured to point at the production Atlas database. Do not paste secrets into chat or commit them to a file.

If using a local terminal, first ensure `backend/.env` contains the correct production `MONGODB_URI` and seed variables, then run:

```bash
cd backend
npm run seed:admin
```

Protect the terminal and `.env` file, verify the script output, and remove the production values from the local environment when finished. Do not create multiple Admin users unnecessarily. If this database contains legacy product documents that have not been upgraded, review the migration script's dry-run before applying it; do not run migrations blindly against production.

## 4. Deploy the frontend on Vercel

1. Open Vercel and choose **Add New → Project**.
2. Import the same GitHub repository.
3. Set **Root Directory** to `frontend`.
4. Use the Next.js framework preset. Vercel should detect the project's standard build settings.
5. Add this environment variable before deploying:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://<your-render-service>.onrender.com/api` |

Replace the sample hostname with the actual Render URL and keep `/api` at the end. This variable is exposed to browser code, so it must contain only the public API base URL—not secrets.

6. Deploy. Open the public Vercel URL shown in the dashboard. If you change `NEXT_PUBLIC_API_URL` after deployment, trigger a new frontend deployment because it is consumed during the frontend build.

## 5. Configure CORS

After Vercel has produced the public site URL, return to Render → Environment and set `FRONTEND_URL` to the exact frontend origin, such as `https://<your-project>.vercel.app`. Do not include a path like `/api` and avoid a trailing slash unless the backend specifically expects one. Save the change and redeploy/restart the backend if prompted.

If you later add a custom domain or preview domain, ensure the backend CORS configuration allows the origin you intend to use. Do not solve CORS problems by broadly allowing every origin in production.

## 6. Final smoke test

Use the deployed frontend URL and confirm:

- The login page loads and the initial Admin account can sign in.
- Product listing and filtering work.
- A test sale succeeds, invoice details are shown, and stock decreases.
- Inventory movements and low-stock views load.
- Reports load without API/CORS errors.
- A Staff account cannot access Admin-only product management, manual adjustments, or user creation.
- Browser developer tools and Render logs show no missing environment variables or failed API requests.

Use clearly identifiable test products and sales. Avoid putting real customer data into a public demo database.

## Common problems

- **Frontend loads but data does not:** verify `NEXT_PUBLIC_API_URL` is the Render URL plus `/api`, then redeploy Vercel.
- **CORS error:** set Render `FRONTEND_URL` to the exact deployed Vercel origin, then redeploy/restart the backend.
- **Database connection failure:** confirm the connection string, database user, encoded password, Atlas IP access list, and cluster status.
- **Login fails:** check that the initial Admin was seeded into the same Atlas database referenced by Render.
- **Sale transaction fails:** check Atlas cluster support for MongoDB transactions and the backend logs.
- **API returns 500:** inspect Render logs; do not expose secret environment values in screenshots or messages.

## Official guides

- [Render: Deploy a Node Express App](https://render.com/docs/deploy-node-express-app)
- [Render: Connect to MongoDB Atlas](https://render.com/docs/connect-to-mongodb-atlas)
- [Vercel: Using Monorepos](https://vercel.com/docs/monorepos)
- [MongoDB Atlas: IP Access List](https://www.mongodb.com/docs/atlas/security/ip-access-list/)
