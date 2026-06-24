# Project State

## Completed Features
- **Database Architecture**: Fully migrated from MongoDB to Supabase PostgreSQL.
- **Automated DDL**: Created `config/initSupabaseDb.js` that uses `pg` driver to automatically generate the `profiles` table on first startup.
- **Authentication System**: Integrated Supabase Auth in `authController.js` to handle `/register` and `/login` seamlessly.
- **Session Middleware**: Updated `authMiddleware.js` to verify JSON Web Tokens against Supabase (`supabase.auth.getUser()`).
- **Profile Management**: Updated `userController.js` to map directly to the `profiles` table.
- **Frontend–Backend Integration**: All frontend pages (login, home, profile) now use a shared `js/api.js` module for centralized API communication.
  - `apiFetch()` automatically resolves the correct API base URL (same-origin when served from backend, localhost:5001 fallback for `file://`).
  - Auth tokens are auto-injected into all API requests via the shared helper.
  - 401 responses trigger automatic redirect to login.
- **Static File Serving**: Backend serves the entire `frontend/` directory as static files, with root `/` serving `login.html`.
- **Express 5 Compatibility**: Catch-all routes use `{*splat}` syntax compatible with `path-to-regexp` v8.

## Environment Requirements
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_DB_URL` (optional — skips table auto-creation if not set)

## Running the Application
```bash
cd backend
npm run dev     # development (with nodemon)
npm start       # production
```
Server starts on `http://localhost:5001` and serves both the API and frontend.
