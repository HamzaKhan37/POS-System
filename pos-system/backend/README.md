# POS Backend (MERN)

This backend implements user auth, product/category management, orders, and reports.

Quick start (local dev):

1. Copy `.env.example` to `.env` and edit if needed (MongoDB URI).
2. Install dependencies:

```powershell
cd pos-system/backend
npm install
```

3. Start server (dev):

```powershell
npm run dev
```

Optional: run Mongo locally using Docker (recommended for development)

```powershell
# in pos-system/backend
docker compose up -d
# this will start a mongo container and create the volume 'pos-mongo-data'
```

If you use Docker, ensure `MONGO_URI` in `.env` points to `mongodb://localhost:27017/pos_db` (this is the default in `.env.example`).  If you prefer MongoDB Atlas, set the Atlas URI in `MONGO_URI` and ensure the password is URL-encoded and your IP is whitelisted.

## Troubleshooting MongoDB connection errors

If you see network/authentication errors when the server starts, follow these steps:

1. Rotate the exposed database password immediately (Atlas → Security → Database Access → edit user or create a new user), and update your local `backend/.env` with the new password (DO NOT commit `.env`).
2. Ensure the password is URL-encoded when used in the connection string. Example using Node REPL:

```bash
node -e "console.log(encodeURIComponent('MyP@ss#1'))"
# → MyP%40ss%231
```

3. Add your development IP to Atlas Network Access (or use `0.0.0.0/0` temporarily while debugging). In Atlas: Security → Network Access → Add IP Address.
4. Test the connection locally using `mongosh` or by starting the server (`npm run dev`) and watching for the **MongoDB connected** message.
5. If you previously committed your `.env` with secrets, remove it from the repository and consider scrubbing history:

```bash
# remove the file from git index and commit
git rm --cached backend/.env
git commit -m "Remove sensitive backend .env from repo" && git push

# To scrub from history (advanced, runs on local machine):
# Using BFG: https://rtyley.github.io/bfg-repo-cleaner/
# Example (replace with your secret value):
java -jar bfg.jar --delete-files backend/.env
# or to replace text
java -jar bfg.jar --replace-text passwords.txt
# After BFG run: git reflog expire --expire=now --all; git gc --prune=now --aggressive; git push --force
```

If the server still fails to connect, copy the exact error output and open an issue or post it here for help — the error message will usually indicate whether the problem is network related or authentication related.

### Quick connection verification script

After setting `MONGO_URI` in your **local** `backend/.env` (do not commit) and ensuring your IP is whitelisted in Atlas, you can run a quick check:

```powershell
cd pos-system/backend
npm install
# Run the DB connection check (prints collections and approximate counts)
npm run db:check
```

If `npm run db:check` prints the collections and counts, your app can connect to Atlas and you should be able to see the same collections via the Atlas UI.

### Automatic password URL-encoding fallback and unrecoverable cases

The server will now detect if the `MONGO_URI` includes a raw password with special characters and will automatically URL-encode only the password portion for the connection attempt when possible. This helps avoid common "URI malformed" errors.

However, if your password was committed with angle brackets (e.g. `<Mayana@123>`) or contains an unencoded `@` inside it, the URI becomes ambiguous and **cannot** be safely auto-corrected. In that case you will see a clear error explaining the problem. To fix it:

1. Rotate the user password in Atlas (Atlas → Security → Database Access → Edit user or create new user). Use a password without angle brackets or an unencoded `@` — or URL-encode (recommended) any reserved characters.
2. Update your local `backend/.env` with the new (URL-encoded) password inside `MONGO_URI`.
3. Add your IP to Atlas Network Access and re-run `npm run db:check`.

Note: this is a convenience fallback — you should still rotate any password that was committed to the repo and avoid committing `.env` files with secrets.
Seeding initial data (products + categories + admin user):

```powershell
cd pos-system/backend
# ensure Mongo is running and .env has MONGO_URI set
npm run seed
```

After seeding, an initial admin user is created for local development. To create admin accounts via the API, set `ADMIN_SIGNUP_KEY` in your `.env` and POST to `/api/auth/register-admin` with JSON body:

```
{ "name": "Admin name", "email": "email@example.com", "password": "strongpass", "adminKey": "<your ADMIN_SIGNUP_KEY>" }
```

Note: The server will accept admin creation when the supplied `adminKey` matches `ADMIN_SIGNUP_KEY` (this allows creating additional admin accounts if needed). This is convenient for local/dev, but **do not** use a weak or shared key in production — treat it like a secret and rotate as needed.

Security notes:
- Set `JWT_SECRET` in your `.env` for production to a secure long random string (the server warns and will exit if missing in production).
- To enable Google Sign-In set `GOOGLE_CLIENT_ID` in `.env` and add a Google Sign-In button in the frontend that calls `POST /api/auth/google` with `{ idToken }`.

API endpoints:
- POST /api/auth/login
- POST /api/auth/register (admin only)
- GET/POST/PUT/DELETE /api/products
- GET/POST/PUT/DELETE /api/categories
- POST /api/orders
- POST /api/payments/phonepe/upi-qr (returns dataURL + upi link)
- POST /api/payments/phonepe/webhook (PhonePe webhook - raw body signature validated)
- POST /api/payments/phonepe/webhook-test (dev only - enable with PHONEPE_ALLOW_TEST=true)
- GET /api/reports/* (admin only)

Notes:
- This is a minimal production-friendly backend to be extended further.
- PhonePe UPI integration (sandbox) added: configure the following env vars in `.env`:
  - PHONEPE_MERCHANT_VPA, PHONEPE_MERCHANT_NAME, PHONEPE_SECRET, PHONEPE_SANDBOX_URL
  - PHONEPE_ALLOW_TEST=true (to permit `/webhook-test` in local dev)
- For local webhook testing use `ngrok http 5000` and configure the sandbox webhook URL to `https://<your-tunnel>/api/payments/phonepe/webhook` (PhonePe sandbox docs required for exact steps).
