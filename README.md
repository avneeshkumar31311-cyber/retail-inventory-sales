# RetailSync — Retail Inventory & Sales Management

RetailSync is a web application for managing retail products, stock movements, sales, invoices, and reports. It has a Next.js frontend and an Express/TypeScript API backed by MongoDB.

## Features

- JWT-based sign-in and role-based access for Admin and Staff users.
- Product catalog with category and active/inactive status filtering.
- Sales checkout with invoice numbers, discount and tax calculations, and printable invoices.
- Transactional stock deduction when a sale is recorded.
- Inventory movement history, low-stock reporting, and Admin-only manual stock adjustments.
- Sales, top-products, and profit reports.
- OpenAPI specification and a Postman collection for API testing.

## Technology

- Frontend: Next.js, React, TypeScript
- Backend: Node.js, Express, TypeScript
- Database: MongoDB Atlas with Mongoose
- Authentication: JWT and bcrypt
- API documentation: OpenAPI (`backend/openapi.yaml`)

## Repository layout

```text
.
├── backend/       # Express API, models, services, tests, and OpenAPI spec
├── frontend/      # Next.js web application
├── docs/          # Project API, deployment, and Postman guides
└── postman/       # Postman collection and local environment
```

## Requirements

- Node.js 20.9 or later
- npm
- A MongoDB database (MongoDB Atlas is suitable)

## Run locally

### 1. Configure the backend

Create `backend/.env` (do not commit it) with these values:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<database>?retryWrites=true&w=majority
JWT_SECRET=<long-random-secret>
PORT=4000
FRONTEND_URL=http://localhost:3000
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_NAME=RetailSync Admin
SEED_ADMIN_PASSWORD=<strong-password>
```

Use a database user created in MongoDB Atlas. URL-encode special characters in the database password if needed. Keep real credentials out of source control.

### 2. Install and start the backend

```bash
cd backend
npm install
npm run typecheck
npm test
npm run dev
```

The API runs on `http://localhost:4000`; the health endpoint is `http://localhost:4000/api/health`.

To create the initial Admin user, run this once in another terminal after setting the backend environment variables:

```bash
cd backend
npm run seed:admin
```

Do not commit the password or `.env` file. If your database already has an Admin user, do not seed a duplicate unnecessarily.

### 3. Configure and start the frontend

Create `frontend/.env.local` (do not commit it):

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

Then run:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser. The backend must be running as well.

## Useful checks

Backend:

```bash
cd backend
npm run typecheck
npm test
npm run build
```

Frontend:

```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

## Roles and access

| Capability | Admin | Staff |
|---|---:|---:|
| View products and inventory | Yes | Yes |
| Create/edit/deactivate products | Yes | No |
| Complete sales and view sales history | Yes | Yes |
| View reports | Yes | Yes |
| Make manual stock adjustments | Yes | No |
| Create users | Yes | No |

Backend authorization is authoritative; hiding a button in the UI is not the security boundary.

## API and testing documentation

- API endpoints and examples: [`docs/API.md`](docs/API.md)
- Deployment guide: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)
- Postman setup: [`docs/POSTMAN.md`](docs/POSTMAN.md)
- OpenAPI specification: [`backend/openapi.yaml`](backend/openapi.yaml)
- Postman files: [`postman/`](postman/)

## Data notes

- Sales record item-level purchase-cost snapshots for profit reporting. Older sales without a recorded cost cannot support a reliable historical profit calculation and may be flagged in reports.
- Product deactivation is soft deactivation, so historical sales remain associated with the product.
- Use the product migration script only if an existing database still contains legacy product documents that need the newer fields. Run its dry-run first; apply only after reviewing the output:

```bash
cd backend
npm run migrate:products
npm run migrate:products -- --apply
```

Do not run the `--apply` form against production until you have checked the dry-run and have a database backup.

## Deployment

The suggested arrangement is to host the API on Render, the frontend on Vercel, and the database on MongoDB Atlas. Follow [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). Add the actual public URLs to the project only after deployment succeeds.

## Security checklist

- Never commit `.env`, `.env.local`, credentials, JWT secrets, or production connection strings.
- Use strong database and Admin passwords, and a long random `JWT_SECRET`.
- Restrict MongoDB Atlas network access to the application's required outbound IPs where possible.
- Set `FRONTEND_URL` to the exact deployed frontend origin and `NEXT_PUBLIC_API_URL` to the deployed API's `/api` base URL.
- Use HTTPS deployment URLs and do not publish a Postman environment containing real credentials.
