# pos-system (MERN POS)

This workspace contains a minimal MERN POS application scaffold.

Folders:
- `backend/` — Express + Mongoose backend
- `frontend/` — React + Vite frontend

Quick start (local dev):

1. Backend
   - cd pos-system/backend
   - copy `.env.example` to `.env` and update if needed
   - npm install
   - npm run dev

2. Frontend
   - cd pos-system/frontend
   - npm install
   - npm run dev

Defaults:
- Backend listens on port 5000 and exposes APIs under `/api`
- Frontend expects API at `http://localhost:5000/api` (see `src/services/api.js`)

This scaffold includes:
- Auth (JWT), role-based middleware
- Products & Categories CRUD
- Orders with stock deduction
- Reporting endpoints (sales summary, top products, low stock)

Next steps I can implement on request:
- Add full test coverage and CI
- Add PDF receipts & email
- Add Stripe integration
- Add Docker and deployment configs
- Add PhonePe (UPI) integration (done: QR generation + webhook endpoints; see `backend/.env.example` and `backend/README.md` for test instructions)
- Seed sample cafe products and a demo admin user (run `npm run seed` in `pos-system/backend`)

To try the demo quickly:
1. Start Mongo (Docker or Atlas), start backend: `npm run dev`.
2. In backend: `npm run seed` to add categories, products (with images), and an admin user `admin@pos.test` / `adminpass`.
3. Start frontend: `cd pos-system/frontend && npm run dev` and open the POS page to try adding items and using UPI simulation.

Tell me which of the above to finish next and I'll continue.

---

Roles & features:
- Users have roles: `admin`, `cashier`, `user` (customers).
- Admin: can manage products, users, and view analytics (dashboard with charts).
- Cashier: can create orders (checkout) in the POS.
- Customer (user): can sign up and checkout products.

Frontend notes:
- The app hydrates auth from `localStorage` token on load (look for `auth/initialize` in the frontend code).
- To enable Google Sign-In set `VITE_GOOGLE_CLIENT_ID` in the frontend environment and restart the dev server. The login page will render a Google button when configured.

