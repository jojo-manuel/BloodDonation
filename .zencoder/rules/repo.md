# BloodDonation Repository Overview

## Structure
- backend/ — Node.js + Express API (MongoDB via Mongoose)
- frontend/ — React (Vite) SPA with Tailwind

## Backend
- Entry: backend/server.js
  - Loads env (.env), connects MongoDB (Database/db.js), starts app (app.js)
- App: backend/app.js
  - Security: helmet, morgan, rate limiting (auth endpoints)
  - CORS: allows http://localhost:5173 and http://localhost:4173
  - JSON parsing, cookie-parser
  - Routes mounted:
    - /api/auth → Route/authRoutes.js (register/login/refresh/logout/reset)
    - /api/users → Route/userRoutes.js (me, updateMe)
    - /api/donors → Route/donorRoutes.js (register/search/getOne)
  - Health: GET /api/health
  - 404 + centralized error handler

### Environment
- backend/config/env.js validates env with zod; recommended .env keys:
  - MONGO_URI
  - JWT_ACCESS_SECRET
  - JWT_REFRESH_SECRET
  - JWT_ACCESS_EXPIRES_IN (default 15m)
  - JWT_REFRESH_EXPIRES_IN (default 7d)
  - PORT (default 5000)
  - CORS_ORIGIN (default http://localhost:5173)
- NOTE: Database/db.js currently has a hardcoded Mongo URI fallback — move to .env

### Models
- Models/User
  - username (unique), password (bcrypt hashed), role ("donor"|"bloodbank"), resetPasswordToken/Expires
  - methods: comparePassword
- Models/donor.js
  - Detailed donor profile linked by userId (name, DOB, gender, bloodGroup, contacts, addresses, donation history)

### Middlewares
- Middleware/auth.js — JWT access token verification (sets req.user)
- Middleware/validate.js — wraps zod schemas
- Middleware/errorhandle.js — error handler

### Validators (zod)
- validators/schemas.js:
  - donorRegisterBody: bloodGroup, availability, lastDonationDate?, city, state, pincode, contactPreference
  - userUpdateBody: name?, phone?, address?
  - (registerBody/loginBody present but not used by current routes)

### Routes & Handlers
- Route/authRoutes.js (self-contained)
  - POST /api/auth/register → { username, password, role } → returns { accessToken, refreshToken, user }
  - POST /api/auth/login → { username,password } OR email→username → returns tokens
  - POST /api/auth/refresh → { refreshToken } → returns new tokens
  - POST /api/auth/logout → { userId } → clears refresh token (in-memory)
  - POST /api/auth/forgot-password → issues reset token (dev returns in response)
  - POST /api/auth/reset-password → reset via token
  - Also: POST /api/auth/donor/register and /api/auth/bloodbank/register for detailed schemas (not used by current UI)
- Route/donorRoutes.js (+ controllers/donorController.js)
  - POST /api/donors/register (auth) — simplified donor profile for current user
  - GET /api/donors/search — public filtered search + pagination
  - GET /api/donors/:id — get one donor
- Route/userRoutes.js (+ controllers/userController.js)
  - GET /api/users/me (auth)
  - PATCH/PUT /api/users/me (auth) — updates name/phone/address (fields not yet in User model)

### Notes / Inconsistencies
- Two auth approaches exist:
  - Route/authRoutes.js (username-based, in use)
  - controllers/authController.js (email-based, not wired)
- Duplicate/unused middleware: Middleware/authMiddleware.js (uses JWT_SECRET, different path casing), not used
- Route/index.js has a broken require('/patientRoutes') and isn’t used
- User model lacks fields referenced by userController (name, phone, address)
- Donor: detailed model in Models/donor.js vs simplified fields used by /api/donors/register and current UI

## Frontend
- Vite React app
- Routing: src/App.jsx
  - Public: "/" (Landing), "/login", "/register"
  - Protected: "/donor-register", "/user-register", "/bloodbank-register" — wrapped by components/RequireAuth
- API client: src/lib/api.js
  - baseURL: http://localhost:5000/api (overridable via VITE_API_BASE_URL)
  - Attaches Authorization: Bearer <accessToken>
  - Auto-refresh on 401 via /auth/refresh
- Auth pages:
  - Register.jsx: derive username from email local-part, POST /auth/register, store tokens, redirect by role
  - Login.jsx: POST /auth/login (username/email + password), store tokens
  - DonorRegister.jsx: POST /donors/register with simplified donor profile

## Run Locally
1) Backend
- Create backend/.env with required keys (see Environment above)
- npm install
- npm run dev (port 5000)

2) Frontend
- Optional: frontend/.env → VITE_API_BASE_URL=http://localhost:5000/api
- npm install
- npm run dev (port 5173)

## Decisions Needed
1) Auth standardization
- Keep username-based auth (current, frontend derives username)
- OR switch to email-based auth, storing both email and username

2) User model fields
- Add name, email, phone, address to Models/User, wire to /users/me

3) Donor model alignment
- Keep simplified donor profile (current UI & donorRoutes)
- OR adopt detailed donor schema (update UI to collect required fields)

4) Cleanup unused/conflicting code
- Remove controllers/authController.js, Middleware/authMiddleware.js, fix/retire Route/index.js

## Suggested Next Steps
- Choose auth approach + donor model level
- Update Models/User and routes accordingly
- Remove unused files to reduce confusion
- Add a simple Donor Search UI page for /api/donors/search (if desired)