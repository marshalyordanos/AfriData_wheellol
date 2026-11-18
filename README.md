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

| Site | URL | Runs as |
|---|---|---|
| Admin | `https://admin.wheellol.com` (or `wheellol.com` if no website lives there) | `admin` container (nginx) on 127.0.0.1:8080 |
| REST API | `https://api.wheellol.com` | `backend` container, gateway on 127.0.0.1:3000 |
| Sockets | `https://socket.wheellol.com` | `backend` container, notify-hub on 127.0.0.1:4004 |

- **HTTPS, two modes** (`PROXY` in `/opt/wheellol/.env`, chosen on the first run):
  - `nginx`: nginx is already running (a shared server with the website and other apps). nginx stays,
    and only the Wheellol sites are added or updated, with a config backup and an automatic restore if
    `nginx -t` fails. certbot issues and **renews** the certificates.
  - `caddy`: fresh server. Caddy owns ports 80/443 and **renews** certificates itself.
- **Database:** your **existing Postgres and Redis** are used as they are. The backend runs on the host
  network, so `localhost:5432` in the old `.env` still works. All backend ports listen on `127.0.0.1` only.
- **Fresh server:** `COMPOSE_PROFILES=db,redis` uses the bundled Postgres and Redis.

### Deploy (one command)

```bash
# from your laptop: copies deploy.sh to the server and runs it there
./deploy.sh root@YOUR_SERVER_IP

# or on the server
curl -fsSLO https://raw.githubusercontent.com/marshalyordanos/AfriData_wheellol/main/deploy.sh
sudo bash deploy.sh
```

The first run:

1. Installs whatever is missing (git, curl, Docker + Compose, cron, `ss`/`ps` tools) and adds
   swap. It waits if automatic updates are using apt, checks disk space, opens ports 80/443 in
   the firewall, and puts the code in `/opt/wheellol`. Node, pm2, nginx, certbot and the Postgres
   client are **not** needed: they run inside the containers.
2. **Finds your production backend `.env` and imports it**: same database, same keys. It asks
   for anything missing, such as `AFRO_MESSAGE_API_KEY` or a real `JWT_SECRET`.
3. Checks DNS for `wheellol.com`, `api.` and `socket.`. If `www.` already points at the
   server, it also adds a redirect from `www.wheellol.com` to `wheellol.com`.
4. Downloads the images from ghcr.io, or builds them if the download fails.
5. **Checks the database and pending migrations while the old system is still running.** If
   anything looks wrong, it stops here and nothing is changed.
6. **Backs up the database** to `/opt/wheellol/backups/`.
7. Shows what is using the backend ports 3000/4001-4004 (the old pm2 backend), asks you, then
   stops it. It is stopped, not deleted. Other pm2 apps, the website and nginx are not touched. In
   `caddy` mode it also frees 80/443.
8. Starts the new stack and runs the migrations. In `nginx` mode it adds the admin site and gets
   its certificate with certbot. Then it checks every URL through this server and prints the
   certificate expiry dates.
9. Sets up a daily database backup at 02:30. The last 14 backups are kept.

If the new backend does not come up, the script offers to **roll back**. Rollback restarts
exactly what it stopped.

Run the script again any time to update: it pulls code and images, checks, backs up and
restarts.

```bash
bash /opt/wheellol/deploy.sh check      # steps 1-6 only (install, .env, images, DB check, backup) — switches nothing
bash /opt/wheellol/deploy.sh status     # services, certificate days left, last backups, disk
bash /opt/wheellol/deploy.sh logs       # follow logs (add a service name: logs backend)
bash /opt/wheellol/deploy.sh backup     # database backup now
bash /opt/wheellol/deploy.sh rollback   # stop new stack, start the old services again
```

### Automatic deploys from GitHub

After the first manual run, open **Settings → Secrets and variables → Actions** and add the
secrets `SSH_HOST`, `SSH_USER` and `SSH_KEY` (optionally `SSH_PORT`). From then on, every push
to `main` builds the images and runs `deploy.sh` on the server with no questions asked.

If you use domains other than `api.` / `socket.wheellol.com`, also set the repository variables
`API_DOMAIN` and `SOCKET_DOMAIN`, because the admin is built with them.

### Other useful commands (in `/opt/wheellol`)

```bash
docker compose ps
docker compose exec backend npm run seed:catalog      # car types/makes/models
docker compose exec backend npx prisma migrate status
```
