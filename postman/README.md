# RetailSync Postman API Tests

1. Start the backend on port 4000 with a working development database.
2. Import `RetailSync.postman_collection.json` into Postman.
3. Import `RetailSync.local.postman_environment.json`.
4. Select the RetailSync Local environment.
5. Fill in the Admin and existing Staff login credentials.
6. Run the collection in order.

The collection creates test products, inventory movements, and a sale in the connected database. Use a development database, not production. Credentials and tokens should remain local and must not be committed.
