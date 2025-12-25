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
