# Testing the API with Postman

The `postman/` directory contains a RetailSync API collection and a local environment. Import both into Postman to run the prepared API requests.

## Import

1. Open Postman.
2. Choose **Import** and select `postman/RetailSync.postman_collection.json`.
3. Choose **Import** again and select `postman/RetailSync.local.postman_environment.json`.
4. Select the imported local environment in the environment dropdown.

## Configure and run

1. Set the environment's base URL variable to `http://localhost:4000/api` for local testing, or the actual deployed API base URL ending with `/api`.
2. Start the backend before sending requests.
3. Enter credentials for an existing Admin account in the environment's login variables. Do not save/share an environment export containing real passwords or tokens.
4. Send the login request first and use the token returned by the API for protected requests. If the collection has scripts that capture tokens automatically, inspect the request/collection variables if a protected request still returns `401`.
5. Run requests in a sensible order: login, view products, create/update products as Admin, create a sale, then inspect sales, inventory movements, low stock, and reports.

## Role checks

Use an Admin token to test Admin-only operations. Sign in as Staff and verify that Admin-only product writes, manual inventory adjustments, and user creation are rejected by the backend.

## Notes

- Request body fields and validation rules are defined by the backend validators; use the imported collection's examples.
- The local environment should not contain actual credentials committed to Git.
- Use test data. A successful sale affects stock and writes sales/inventory records in the selected database.
- If a request fails, check the selected environment, base URL, backend logs, token validity, user role, and database connectivity.
