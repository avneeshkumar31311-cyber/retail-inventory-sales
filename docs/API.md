# RetailSync API Guide

Base URL locally: `http://localhost:4000/api`

For deployment, replace the local host with the actual backend URL. Authenticate using the login endpoint and send the returned JWT in the `Authorization: Bearer <token>` header for protected endpoints.

## Authentication

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/auth/login` | Public | Authenticate and receive a token |
| `GET` | `/auth/me` | Authenticated | Get the current user's profile |
| `POST` | `/auth/users` | Admin | Create a user |

Example login request:

```json
{
  "email": "admin@example.com",
  "password": "<your-password>"
}
```

Use the exact response returned by your running API to copy the token. Do not commit real tokens or passwords to the repository.

## Products

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/products` | Admin, Staff | List products; supports product filters used by the application |
| `POST` | `/products` | Admin | Create a product |
| `PUT` | `/products/:id` | Admin | Update product details |
| `DELETE` | `/products/:id` | Admin | Deactivate a product without deleting sales history |

Product writes are Admin-only. Validate the body against the application's product validator; use the Postman collection for request templates.

## Sales

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `POST` | `/sales` | Admin, Staff | Create a sale and invoice |
| `GET` | `/sales` | Admin, Staff | List sales |
| `GET` | `/sales/summary` | Admin, Staff | Get sales summary |
| `GET` | `/sales/:id` | Admin, Staff | Get a sale by ID |

Sale creation applies discount and tax calculations, records invoice details, snapshots item costs, creates inventory movement records, and deducts stock within a database transaction. The service requires a MongoDB deployment that supports transactions (such as a suitably configured Atlas cluster).

The current invoice calculation order is: line-item subtotal, discount, tax calculated on the discounted subtotal, then final total. Use the application's request validators and Postman examples for accepted fields.

## Inventory

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/inventory/low-stock` | Admin, Staff | List products at or below the low-stock threshold |
| `GET` | `/inventory/movements` | Admin, Staff | Browse inventory movement history |
| `POST` | `/inventory/adjustments` | Admin | Record a manual stock adjustment |

Manual adjustments are restricted to Admin users and should include a reason. Stock changes caused by sales are recorded as movements too.

## Reports

| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/reports/sales` | Admin, Staff | Sales report with date filtering |
| `GET` | `/reports/top-products` | Admin, Staff | Top-selling products |
| `GET` | `/reports/profit` | Admin, Staff | Profit report based on recorded purchase-cost snapshots |

Historical sales that do not have purchase costs stored cannot provide trustworthy profit figures; check any missing-cost indicator returned by the API.

## Health check

`GET /health` is mounted at the API root, so the complete local URL is `http://localhost:4000/api/health`. Use this endpoint as the Render health-check path: `/api/health`.

## Errors and troubleshooting

- `400 Bad Request`: input failed validation or is malformed.
- `401 Unauthorized`: token is missing, invalid, or expired; sign in again.
- `403 Forbidden`: the user is authenticated but lacks the required role.
- `404 Not Found`: the resource or route does not exist.
- `5xx`: check backend logs and database connectivity.

See `backend/openapi.yaml` for the machine-readable API specification. The Postman collection is the most convenient way to run the prepared requests against a local or deployed instance.
