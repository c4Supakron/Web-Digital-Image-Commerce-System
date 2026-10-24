# V-ART API and PostgreSQL

## Configure PostgreSQL

The API and session store use PostgreSQL. Create a database named `vart_db` on the
PostgreSQL server you use in DBeaver, then set `PGHOST`, `PGPORT`, `PGDATABASE`,
`PGUSER`, and `PGPASSWORD` in the private `server/.env` file. On API startup, the
schema in `db/schema.sql` is applied and the six sample products are inserted if they
do not exist. The API also creates the `user_sessions` table on first start.

In DBeaver, connect with the same host, port, database, username, and password. Keep
`.env` private; do not commit it. Set `DATABASE_URL` instead if the server provides a
connection URI. The optional `db:setup` script initializes a separate project-local
PostgreSQL 18 instance for development when needed.

## Run

```sh
npm install
npm run dev
```

To start the local PostgreSQL instance again after a reboot, run `npm run db:start`.
To stop it, run `npm run db:stop`.

The API listens on port 5000. Check `http://localhost:5000/api/health` for database
connectivity. Start the Vite app separately from `app/` (`npm run dev`).

## Run the full stack with Docker Compose

Start Docker Desktop, then run these commands from the repository root:

```powershell
docker compose --env-file server/.env up --build -d
docker compose --env-file server/.env ps
```

Open the app at `http://localhost:5173`; the Compose API is on port 5001. Compose runs a
separate PostgreSQL container with a persistent volume and maps it to host port 5433
so it can run alongside a locally installed PostgreSQL server on port 5432. Use
`127.0.0.1:5433`, database `vart_db`, username `postgres`, and the `PGPASSWORD` from
`server/.env` when connecting DBeaver to the container database. The API creates the
tables and sample products on first start.

Stop the stack while keeping its database volume with:

```powershell
docker compose --env-file server/.env down
```

For Google sign-in, set `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and
`GOOGLE_CALLBACK_URL` in `.env`. The authorized redirect URI in Google Cloud must be
exactly the value of `GOOGLE_CALLBACK_URL`, normally
`http://localhost:5000/api/auth/google/callback`. The backend then redirects to the
frontend callback page. Client secrets belong only in this backend `.env` file.

The session cookie is HttpOnly and the sessions are stored in PostgreSQL. Set
`NODE_ENV=production`, use HTTPS, and set `FRONTEND_URL` to the production frontend
origin when deploying.
