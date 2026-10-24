# Google Login integration

The React app starts the OAuth flow at `GET {VITE_API_BASE_URL}/api/auth/google`.
The Express backend in `../server` implements the flow and PostgreSQL session store.
After Google verifies the user, it:

1. Validate OAuth `state` and the Google identity on the server.
2. Create or find the local account and create a server-side session.
3. Set the session in a `Secure`, `HttpOnly`, `SameSite=Lax` cookie (use `Secure` in production).
4. Redirect the browser to `{frontend-origin}/auth/google/callback`.

The callback page calls `GET {VITE_API_BASE_URL}/api/auth/me` with credentials and
expects a response shaped like `{ "user": { "id": 1, "username": "...", "name": "...", "email": "...", "role": "MEMBER" } }`.
Configure backend CORS to allow the frontend origin with credentials. Do not return
session tokens in URL query parameters or put Google client secrets in Vite variables.

Configure the backend by copying `server/.env.example` to `server/.env`. Configure the
frontend by copying `app/.env.example` to `app/.env.local` and setting `VITE_API_BASE_URL`.
The default backend URL is `http://localhost:5000`, matching login and registration.
In Google Cloud Console, use the backend OAuth callback URL as the authorized redirect
URI; the app callback above is the post-login redirect back to the frontend.
