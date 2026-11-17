# AfriData_wheellol

Wheellol car-rental platform: backend API and admin dashboard in one repository.

```
backend/   NestJS API: gateway + auth, operations, rental-service, notify-hub (Prisma / Postgres / Redis)
admin/     React + Vite admin dashboard
infra/     server setup and database backup scripts
docker-compose.yml       production stack (Postgres, Redis, backend, admin, Caddy HTTPS)
docker-compose.dev.yml   local Postgres + Redis only
.github/workflows/       CI (build on every push / PR) and Deploy (main -> server)
```

The mobile app (`car_rental_front`) stays in its own repository.

History from the old `car_back` and `car_rental_admin` repositories was kept. To see it for one
app, run `git log -- backend/` or `git log -- admin/`.

## Local development

```bash
# optional: Postgres + Redis in Docker
docker compose -f docker-compose.dev.yml up -d

# backend (http://localhost:3000, socket on :4004)
cd backend
cp .env.example .env        # or use your existing .env
npm install
npx prisma migrate dev
npm run dev                 # gateway, auth, operations, rental-service
npm run start:message       # notify-hub (sockets), in a second terminal

# admin (http://localhost:5173)
cd admin
npm install
npm run dev
```

The admin reads `VITE_API_URL` and `VITE_SOCKET_URL`. Without them it uses
`http://localhost:3000/` and `http://localhost:4004`.

## Production

| Service | URL | Container |
|---|---|---|
| REST API | `https://API_DOMAIN` | `backend:3000` |
| Sockets (notify-hub) | `https://SOCKET_DOMAIN` | `backend:4004` |
| Admin | `https://ADMIN_DOMAIN` | `admin:80` (nginx) |

Caddy handles HTTPS: it gets and renews certificates automatically. Postgres and Redis are
reachable only inside Docker. All five backend services run in one container because the
gateway reaches the others on `127.0.0.1`.

### One-time server setup

1. Create an Ubuntu server and point the three domains' DNS **A records** at it.
2. Copy `infra/server-setup.sh` to the server and run it as root. It installs Docker, sets up
   the firewall and swap, and creates `/opt/wheellol`.
3. Create `/opt/wheellol/.env` from [`.env.example`](.env.example) and fill in the real
   secrets. Use only letters and numbers in `POSTGRES_PASSWORD`, because it goes inside a URL.
4. Stop anything else that listens on ports 80/443, such as an old nginx or old node apps.
5. In GitHub, open **Settings → Secrets and variables → Actions** and add:
   - Secrets: `SSH_HOST`, `SSH_USER`, `SSH_KEY` (a private key; its public key goes into the
     server's `~/.ssh/authorized_keys`), and optionally `SSH_PORT`.
   - Optional variables: `API_DOMAIN`, `SOCKET_DOMAIN`, `DEPLOY_PATH`.

### Deploying

Every push to `main` triggers the **Deploy** workflow. It:

1. builds the `backend` and `admin` Docker images and pushes them to `ghcr.io`, tagged with
   `latest` and the commit SHA;
2. copies `docker-compose.yml`, `Caddyfile` and `infra/` to the server;
3. runs `docker compose pull && docker compose up -d` there.

The backend applies pending Prisma migrations (`prisma migrate deploy`) every time it starts.
Set `RUN_MIGRATIONS=false` in `.env` to turn this off.

You can also run the workflow by hand from **Actions → Deploy → Run workflow**.

### Useful commands (on the server, in `/opt/wheellol`)

```bash
docker compose ps
docker compose logs -f backend
docker compose exec backend npm run seed:catalog      # car types/makes/models
docker compose exec backend npx prisma migrate status
bash infra/backup-db.sh                               # dump DB to ./backups
```

### Moving the existing database

```bash
# on the old server
pg_dump -Fc -U <user> -d wheellol > wheellol.dump
# on the new server (stack running, RUN_MIGRATIONS=false while restoring)
docker compose cp wheellol.dump postgres:/tmp/wheellol.dump
docker compose exec postgres pg_restore -U "$POSTGRES_USER" -d wheellol --clean --if-exists /tmp/wheellol.dump
```
