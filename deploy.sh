#!/usr/bin/env bash
# =============================================================================
#  Wheellol — one-command production deploy
# =============================================================================
#
#  From your Mac (copies this file to the server and runs it there):
#      ./deploy.sh                               # update: pull code, build/download, migrate, restart
#                                                #   (asks the server once, saved in .deploy-target)
#      ./deploy.sh status                        # same server, show status
#      ./deploy.sh root@SERVER_IP                # full setup / update
#      ./deploy.sh root@SERVER_IP status         # services + certificate expiry
#
#  Or directly on the server:
#      bash deploy.sh [setup|status|backup|logs|rollback]
#
#  What "setup" does (safe to run again any time — later runs just update):
#    1. installs everything missing (git, curl, Docker + compose, cron, ss/ps...), adds swap
#    2. gets the code into /opt/wheellol (git; local edits to tracked files are reset)
#    3. builds /opt/wheellol/.env — first run IMPORTS your existing production
#       backend .env (same Postgres, same Redis, same keys)
#    4. checks DNS for the admin / api. / socket. domains
#    5. downloads (or builds) the Docker images
#    6. checks the database + pending migrations   (old system still running)
#    7. BACKS UP the database to /opt/wheellol/backups
#    8. stops the old backend (pm2 / systemd / docker / process) — after asking —
#       and remembers it for `rollback`
#    9. starts the new stack. HTTPS, two modes (PROXY in .env):
#         nginx  nginx is already running (shared server): it stays, only the
#                Wheellol sites are added/updated; certbot renews certificates
#         caddy  fresh server: Caddy owns 80/443 and renews certificates itself
#   10. verifies HTTPS, prints certificate expiry, installs a daily DB backup
#
#  Non-interactive (accept every default):  YES=1 bash deploy.sh
#  Check only (steps 1-7, nothing switched): bash deploy.sh check
#  Optional overrides: OLD_ENV=/path/.env  PROXY=nginx|caddy  WL_ADMIN_DOMAIN=admin.x.com
# =============================================================================
set -Eeu

REPO_URL="${REPO_URL:-https://github.com/marshalyordanos/AfriData_wheellol.git}"
BRANCH="${BRANCH:-main}"
APP_DIR="${APP_DIR:-/opt/wheellol}"
DEFAULT_DOMAIN="${DEFAULT_DOMAIN:-wheellol.com}"
OLD_PORTS="3000 4001 4002 4003 4004"

# ------------------------------------------- from the Mac: plain `./deploy.sh`
# Remembers the server in .deploy-target (not in git) and warns about code that
# is not on GitHub yet — the server deploys what is pushed to $BRANCH, nothing else.
if [ "$(uname -s)" = Darwin ] && [[ "${1:-}" != *@* ]] && [ "${WL_SOURCE_ONLY:-}" != 1 ]; then
  here="$(cd "$(dirname "$0")" && pwd)"
  target="${DEPLOY_TARGET:-$(cat "$here/.deploy-target" 2>/dev/null || true)}"
  if [ -z "$target" ]; then
    read -rp "Server to deploy to (user@host, e.g. root@1.2.3.4): " target
    [[ "$target" == *@* ]] || { echo "Need user@host"; exit 1; }
    echo "$target" > "$here/.deploy-target"
  fi
  if git -C "$here" rev-parse -q --git-dir >/dev/null 2>&1; then
    git -C "$here" fetch -q origin "$BRANCH" 2>/dev/null || true
    local_branch=$(git -C "$here" rev-parse --abbrev-ref HEAD)
    dirty=$(git -C "$here" status --porcelain | wc -l | tr -d ' ')
    ahead=$(git -C "$here" rev-list --count "origin/$BRANCH..HEAD" 2>/dev/null || echo 0)
    if [ "$local_branch" != "$BRANCH" ] || [ "$dirty" != 0 ] || [ "$ahead" != 0 ]; then
      echo "The server deploys GitHub '$BRANCH' ($(git -C "$here" log -1 --format='%h %s' "origin/$BRANCH" | cut -c1-60))."
      [ "$local_branch" = "$BRANCH" ] || echo "  ! you are on branch '$local_branch'"
      [ "$dirty" = 0 ] || echo "  ! $dirty changed file(s) not committed — NOT deployed"
      [ "$ahead" = 0 ] || echo "  ! $ahead commit(s) not pushed — NOT deployed (run: git push)"
      read -rp "Deploy anyway? [y/N] " a; [[ "$a" =~ ^[Yy] ]] || exit 1
    fi
  fi
  echo "Deploying to $target ..."
  set -- "$target" "$@"
fi

# ---------------------------------------------------------------- remote mode
if [[ "${1:-}" == *@* ]]; then
  target="$1"; shift
  scp -q "$0" "$target:/tmp/wheellol-deploy.sh"
  args=$(printf '%q ' "$@")
  envs=""; for v in YES OLD_ENV PROXY WL_ADMIN_DOMAIN; do [ -z "${!v:-}" ] || envs="$envs $v=$(printf '%q' "${!v}")"; done
  exec ssh -t "$target" "if [ \"\$(id -u)\" = 0 ]; then env $envs bash /tmp/wheellol-deploy.sh $args; else sudo env $envs bash /tmp/wheellol-deploy.sh $args; fi"
fi

# Running from $APP_DIR? Re-run from a copy: `git reset` would rewrite this file mid-run.
if [ -z "${WL_REEXEC:-}" ] && [ "$(readlink -f "$0" 2>/dev/null)" = "$APP_DIR/deploy.sh" ]; then
  cp "$0" /tmp/wheellol-deploy.sh; WL_REEXEC=1 exec bash /tmp/wheellol-deploy.sh "$@"
fi

# -------------------------------------------------------------------- helpers
if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'; else B='' G='' Y='' R='' N=''; fi
STEP=0
step() { STEP=$((STEP + 1)); echo; echo "${B}[$STEP] $*${N}"; }
ok()   { echo "  ${G}✓${N} $*"; }
warn() { echo "  ${Y}!${N} $*"; }
die()  { echo "  ${R}✗ $*${N}" >&2; exit 1; }

ask() {            # ask "Question" "default"  -> prints answer
  local a=""
  if [ "${YES:-}" = 1 ]; then echo "${2:-}"; return; fi
  printf '  %s%s: ' "$1" "${2:+ [$2]}" >&2
  read -r a </dev/tty || a=""
  echo "${a:-${2:-}}"
}
ask_yes() {        # ask_yes "Question" [Y|N]
  local def="${2:-Y}" a=""
  if [ "${YES:-}" = 1 ]; then a="$def"; else
    printf '  %s [%s]: ' "$1" "$([ "$def" = Y ] && echo Y/n || echo y/N)" >&2
    read -r a </dev/tty || a=""
  fi
  [[ "${a:-$def}" =~ ^[Yy] ]]
}
ask_secret() {     # ask_secret NAME  -> prints value (hidden input)
  local a=""
  if [ "${YES:-}" = 1 ]; then echo ""; return; fi
  printf '  %s (paste, then Enter; Enter alone = skip): ' "$1" >&2
  read -rs a </dev/tty || a=""; echo >&2
  echo "$a"
}

# env_get FILE KEY -> value (tolerates "KEY = value", quotes, inline comments)
env_get() {
  [ -f "$1" ] || return 0
  grep -E "^[[:space:]]*(export[[:space:]]+)?$2[[:space:]]*=" "$1" | tail -1 \
    | sed -E 's/^[^=]*=[[:space:]]*//; s/[[:space:]]+#.*$//; s/[[:space:]]*$//' \
    | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/' \
    | sed -E 's/\$\$/$/g'
}
envv() { env_get "$APP_DIR/.env" "$1"; }
set_env() {        # set_env KEY VALUE  (in $APP_DIR/.env)
  local v="${2//\$/\$\$}"
  if grep -qE "^$1=" "$APP_DIR/.env"; then
    KEY="$1" VAL="$v" perl -pi -e 's/^\Q$ENV{KEY}\E=.*/$ENV{KEY}=$ENV{VAL}/' "$APP_DIR/.env"
  else
    printf '%s=%s\n' "$1" "$v" >> "$APP_DIR/.env"
  fi
}

dc() { docker compose --project-directory "$APP_DIR" "$@"; }

# libpq-safe URL: drop Prisma-only params (?schema=, pgbouncer=...), keep sslmode
pg_url() {
  local u="$1" base q ssl scheme rest ui host user pass
  base="${u%%\?*}"; q=""; [[ "$u" == *\?* ]] && q="${u#*\?}"
  ssl=$(printf '%s' "$q" | tr '&' '\n' | grep -E '^sslmode=' | head -1 || true)
  scheme="${base%%://*}"; rest="${base#*://}"
  if [[ "$rest" == *@* ]]; then      # user:pa@ss@host -> split at the LAST @
    ui="${rest%@*}"; host="${rest##*@}"; user="${ui%%:*}"; pass=""
    [[ "$ui" == *:* ]] && pass="${ui#*:}"
    pass="${pass//@/%40}"; pass="${pass//#/%23}"; pass="${pass//\//%2F}"; pass="${pass//\?/%3F}"
    base="$scheme://$user${pass:+:$pass}@$host"
  fi
  echo "${base}${ssl:+?$ssl}"
}
db_url() { local u; u="$(envv DIRECT_URL)"; [ -n "$u" ] || u="$(envv DATABASE_URL)"; pg_url "$u"; }
pg_major() {       # major version of the server behind URL
  local n
  n=$(docker run --rm --network host -e PGCONNECT_TIMEOUT=10 postgres:16-alpine \
        psql "$1" -tAc 'show server_version_num' 2>/dev/null | tr -d '[:space:]') || return 1
  [ -n "$n" ] && echo $((n / 10000))
}

public_ip() {
  curl -s --max-time 3 http://169.254.169.254/metadata/v1/interfaces/public/0/ipv4/address 2>/dev/null \
    || curl -s -4 --max-time 5 https://api.ipify.org 2>/dev/null || true
}
resolve() { getent ahostsv4 "$1" 2>/dev/null | awk '{print $1}' | sort -u | tr '\n' ' ' | sed 's/ $//'; }

cert_info() {      # cert_info DOMAIN -> "expires <date> (<n> days)"
  local exp days
  local pem; pem=$(echo | timeout 10 openssl s_client -servername "$1" -connect 127.0.0.1:443 2>/dev/null \
        | openssl x509 2>/dev/null) || true
  [ -n "$pem" ] && echo "$pem" | openssl x509 -noout -checkhost "$1" 2>/dev/null | grep -q "does match" \
    || { echo "no certificate for this name yet"; return; }
  exp=$(echo "$pem" | openssl x509 -noout -enddate | cut -d= -f2)
  days=$(( ( $(date -d "$exp" +%s) - $(date +%s) ) / 86400 ))
  echo "expires $(date -d "$exp" +%Y-%m-%d) ($days days left)"
}

need_root() { [ "$(id -u)" = 0 ] || die "Run as root (or: sudo bash deploy.sh)"; }

# ------------------------------------------------------------------- steps
# ---- package manager (Ubuntu/Debian = apt; CentOS/Rocky/Alma/Fedora = dnf/yum)
PKG=""
pkg_detect() {
  if command -v apt-get >/dev/null; then PKG=apt
  elif command -v dnf >/dev/null; then PKG=dnf
  elif command -v yum >/dev/null; then PKG=yum
  else die "Unsupported Linux (no apt/dnf/yum). Use Ubuntu 22.04/24.04."; fi
}
APT_UPDATED=""
pkg_install() {   # pkg_install <package>...   (waits if automatic updates hold the lock)
  [ $# -gt 0 ] || return 0
  echo "  installing: $*"
  case $PKG in
    apt)
      export DEBIAN_FRONTEND=noninteractive
      local o=(-o DPkg::Lock::Timeout=600 -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold)
      [ -n "$APT_UPDATED" ] || { apt-get "${o[@]}" update -qq >/dev/null; APT_UPDATED=1; }
      apt-get "${o[@]}" install -y -qq --no-install-recommends "$@" >/dev/null ;;
    dnf|yum) $PKG install -y -q "$@" >/dev/null ;;
  esac || die "could not install: $*"
}
# command -> package name (apt / rpm)
pkg_for() {
  case "$1:$PKG" in
    ss:apt) echo iproute2 ;;        ss:*) echo iproute ;;
    ps:apt) echo procps ;;          ps:*) echo procps-ng ;;
    crontab:apt) echo cron ;;       crontab:*) echo cronie ;;
    getent:apt) echo libc-bin ;;    getent:*) echo glibc-common ;;
    fallocate:*|mkswap:*|swapon:*) echo util-linux ;;
    timeout:*|sort:*|df:*) echo coreutils ;;
    *) echo "$1" ;;   # git curl openssl perl gzip awk(gawk) sed grep tar
  esac
}

install_base() {
  pkg_detect
  # 1. every tool this script uses
  local need="" c
  for c in git curl openssl perl gzip tar sed grep awk ss ps crontab getent timeout sort df fallocate mkswap swapon; do
    command -v "$c" >/dev/null || need="$need $(pkg_for "$c")"
  done
  [ "$PKG" = apt ] && [ ! -s /etc/ssl/certs/ca-certificates.crt ] && need="$need ca-certificates"
  # shellcheck disable=SC2086,SC2046
  [ -z "$need" ] || pkg_install $(echo $need | tr ' ' '\n' | sort -u | sed 's/^awk$/gawk/')
  ok "tools: git $(git --version | awk '{print $3}'), curl, openssl, ss, ps, cron"

  # cron must run for the daily backup
  systemctl enable --now cron >/dev/null 2>&1 || systemctl enable --now crond >/dev/null 2>&1 || true

  # 2. disk space (images + build need ~4 GB)
  local free_gb; free_gb=$(df -Pk / | awk 'NR==2{print int($4/1048576)}')
  [ "$free_gb" -ge 3 ] || die "Only ${free_gb} GB free on /. Need at least 3 GB. Free some space (e.g. docker system prune -a, old logs) and run again."
  [ "$free_gb" -ge 6 ] || warn "only ${free_gb} GB free on / — OK for now, but keep an eye on it"

  # 3. Docker Engine + compose plugin
  if command -v docker >/dev/null && [[ "$(command -v docker)" == /snap/* ]]; then
    die "Docker is installed as a snap, which cannot use $APP_DIR. Remove it (snap remove docker) and run again — the script installs the official Docker."
  fi
  if ! command -v docker >/dev/null; then
    echo "  installing Docker (official get.docker.com)..."
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh || die "cannot download Docker installer (internet/DNS on the server?)"
    if ! sh /tmp/get-docker.sh >/dev/null 2>&1; then
      [ "$PKG" = apt ] || die "Docker install failed. Try by hand: sh /tmp/get-docker.sh"
      warn "Docker's installer does not support this release yet — using Ubuntu's own Docker packages"
      pkg_install docker.io
      pkg_install docker-compose-v2 2>/dev/null || pkg_install docker-compose-plugin
    fi
    rm -f /tmp/get-docker.sh
  fi
  systemctl enable --now docker >/dev/null 2>&1 || service docker start >/dev/null 2>&1 || true
  local i; for i in 1 2 3 4 5 6 7 8 9 10; do docker info >/dev/null 2>&1 && break; sleep 2; done
  docker info >/dev/null 2>&1 || die "Docker is installed but not running. Check: systemctl status docker"
  docker compose version >/dev/null 2>&1 || pkg_install docker-compose-plugin 2>/dev/null || pkg_install docker-compose-v2
  # docker-compose.yml needs compose >= 2.20 (depends_on.required)
  local cv; cv=$(docker compose version --short 2>/dev/null | sed 's/^v//')
  if [ "$(printf '%s\n2.20.0\n' "$cv" | sort -V | head -1)" != "2.20.0" ]; then
    APT_UPDATED=""; pkg_install docker-compose-plugin || true
    cv=$(docker compose version --short 2>/dev/null | sed 's/^v//')
    [ "$(printf '%s\n2.20.0\n' "$cv" | sort -V | head -1)" = "2.20.0" ] \
      || die "Docker Compose $cv is too old (need 2.20+). Update Docker: curl -fsSL https://get.docker.com | sh"
  fi
  ok "Docker $(docker --version | awk '{print $3}' | tr -d ,) / compose $(docker compose version --short)"

  # 4. swap (small droplets run out of memory while building)
  if ! swapon --show 2>/dev/null | grep -q .; then
    if fallocate -l 2G /swapfile 2>/dev/null || dd if=/dev/zero of=/swapfile bs=1M count=2048 status=none; then
      chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile \
        && { grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab; ok "added 2G swap"; } \
        || { rm -f /swapfile; warn "could not add swap (not critical)"; }
    fi
  fi

  # 5. firewall: open 80/443 if one is active
  if command -v ufw >/dev/null && ufw status | grep -q "Status: active"; then
    ufw allow 80/tcp >/dev/null; ufw allow 443/tcp >/dev/null; ufw allow 443/udp >/dev/null
    ok "firewall (ufw): 80/443 open"
  elif command -v firewall-cmd >/dev/null && firewall-cmd --state >/dev/null 2>&1; then
    firewall-cmd -q --permanent --add-service=http --add-service=https && firewall-cmd -q --reload
    ok "firewall (firewalld): 80/443 open"
  fi
  [ "$(uname -m)" = x86_64 ] || warn "server is $(uname -m): ready-made images are x86_64, so they will be built here (slower)"
}

get_code() {
  if [ -d "$APP_DIR/.git" ]; then
    git -C "$APP_DIR" fetch -q origin "$BRANCH"
    git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  elif [ -d "$APP_DIR" ] && [ -n "$(ls -A "$APP_DIR" 2>/dev/null)" ]; then
    local tmp; tmp=$(mktemp -d)
    git clone -q --branch "$BRANCH" "$REPO_URL" "$tmp/repo"
    mv "$tmp/repo/.git" "$APP_DIR/.git"; rm -rf "$tmp"
    git -C "$APP_DIR" reset -q --hard "origin/$BRANCH"
  else
    git clone -q --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  fi
  mkdir -p "$APP_DIR/backups" "$APP_DIR/caddy-extra"
  ok "code at $APP_DIR ($(git -C "$APP_DIR" log -1 --format='%h %s' | cut -c1-70))"
}

find_old_env() {   # prints candidate .env files that look like the old backend
  find /root /home /var/www /srv /opt -maxdepth 6 -name .env -type f \
       -not -path "$APP_DIR/*" -not -path '*/node_modules/*' 2>/dev/null \
    | while read -r f; do grep -qE '^[[:space:]]*DATABASE_URL' "$f" 2>/dev/null && echo "$f"; done || true
}

make_env() {
  local envf="$APP_DIR/.env" old="" i=0 pick
  echo "  First run: creating $envf"
  mapfile -t cands < <(find_old_env)
  if [ "${#cands[@]}" -gt 0 ]; then
    echo "  Found existing backend settings:"
    for f in "${cands[@]}"; do i=$((i + 1)); echo "    $i) $f  ($(stat -c %y "$f" | cut -d. -f1))"; done
    pick="${OLD_ENV:-$(ask "Import which one? (number, a path, or 0 = none)" "1")}"
    if [[ "$pick" =~ ^[0-9]+$ ]]; then [ "$pick" -ge 1 ] && old="${cands[$((pick - 1))]:-}"; else old="$pick"; fi
  else
    old="${OLD_ENV:-$(ask "Path to your production backend .env (Enter = none)" "")}"
  fi
  [ -z "$old" ] || [ -f "$old" ] || die "File not found: $old"

  # ---- HTTPS mode: keep a running nginx (shared server) or let Caddy own 80/443
  local proxy="${PROXY:-}"
  if [ -z "$proxy" ]; then
    if systemctl is-active -q nginx 2>/dev/null; then
      warn "nginx is already running here (sites: $(nginx_names | cut -c1-100))"
      if ask_yes "Keep nginx + certbot and only add/update the Wheellol sites in it?" Y; then proxy=nginx; else proxy=caddy; fi
    else proxy=caddy; fi
  fi
  ok "HTTPS by: $proxy"

  local admin api socket email def_admin="$DEFAULT_DOMAIN"
  if [ "$proxy" = nginx ] && [ -n "$(nginx_site_for "$DEFAULT_DOMAIN")" ]; then
    def_admin="admin.$DEFAULT_DOMAIN"
    ok "$DEFAULT_DOMAIN is already a site in nginx (your website) — admin goes on $def_admin"
  fi
  admin="${WL_ADMIN_DOMAIN:-$(ask "Admin website domain" "$def_admin")}"
  api=$(ask "API domain" "api.$DEFAULT_DOMAIN")
  socket=$(ask "Socket domain" "socket.$DEFAULT_DOMAIN")
  email=$(ask "Email for certificate notices" "admin@$DEFAULT_DOMAIN")
  local owner_repo; owner_repo=$(echo "$REPO_URL" | sed -E 's#.*github.com[:/]##; s#\.git$##' | tr 'A-Z' 'a-z')

  umask 077
  {
    echo "# ---- Wheellol deploy settings (deploy.sh, $(date +%F)) ----"
    echo "ADMIN_DOMAIN=$admin"
    echo "API_DOMAIN=$api"
    echo "SOCKET_DOMAIN=$socket"
    echo "ACME_EMAIL=$email"
    echo "PROXY=$proxy"
    local ap=8080; while ss -ltnH "sport = :$ap" | grep -q .; do ap=$((ap + 1)); done
    echo "ADMIN_PORT=$ap"
    echo "BACKEND_IMAGE=ghcr.io/$owner_repo-backend"
    echo "ADMIN_IMAGE=ghcr.io/$owner_repo-admin"
    echo "COMPOSE_PROFILES="
    echo "RUN_MIGRATIONS=true"
    echo
    echo "# ---- App settings${old:+ (imported from $old)} ----"
  } > "$envf"
  chmod 600 "$envf"

  if [ -n "$old" ]; then
    local skip='^(PROXY|ADMIN_DOMAIN|API_DOMAIN|SOCKET_DOMAIN|ACME_EMAIL|ADMIN_PORT|BACKEND_IMAGE|ADMIN_IMAGE|COMPOSE_PROFILES|RUN_MIGRATIONS|IMAGE_TAG|NODE_ENV|USER_PORT|GATEWAY_HOST|AUTH_HOST|SERVICE_HOST|NOTIFY_HOST)$'
    grep -E '^[[:space:]]*(export[[:space:]]+)?[A-Za-z_][A-Za-z0-9_]*[[:space:]]*=' "$old" \
      | sed -E 's/^[[:space:]]*(export[[:space:]]+)?([A-Za-z_][A-Za-z0-9_]*)[[:space:]]*=.*/\2/' | awk '!seen[$0]++' \
      | while read -r k; do
          [[ "$k" =~ $skip ]] && continue
          set_env "$k" "$(env_get "$old" "$k")"
        done
    ok "imported $(grep -cE '^[A-Z]' "$envf") settings from $old"
    # the old code had the AfroMessage key written in the source; the new code reads the env
    if [ -z "$(envv AFRO_MESSAGE_API_KEY)" ]; then
      local od tok; od=$(dirname "$old")
      tok=$(cat "$od/src/utils/sendSms.ts" "$od/dist/utils/sendSms.js" 2>/dev/null | grep -vE '^[[:space:]]*//' \
            | grep -oE 'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+' | head -1 || true)
      [ -z "$tok" ] || { set_env AFRO_MESSAGE_API_KEY "$tok"; ok "AFRO_MESSAGE_API_KEY taken from the old code ($od/src/utils/sendSms.ts)"; }
    fi
  fi

  # ---- database
  if [ -z "$(envv DATABASE_URL)" ]; then
    warn "No DATABASE_URL — using a NEW bundled Postgres (empty database)."
    local pw; pw=$(openssl rand -hex 20)
    set_env POSTGRES_USER wheellol; set_env POSTGRES_PASSWORD "$pw"; set_env POSTGRES_DB wheellol
    set_env DATABASE_URL "postgresql://wheellol:$pw@127.0.0.1:5432/wheellol?schema=public"
    set_env DIRECT_URL "postgresql://wheellol:$pw@127.0.0.1:5432/wheellol?schema=public"
    PROFILES="db"
  fi
  # ---- redis: reuse the existing one if it is running, otherwise bundle one
  local ru; ru="$(envv REDIS_URL)"
  if [ -z "$ru" ]; then set_env REDIS_URL "redis://127.0.0.1:6379"; ru="redis://127.0.0.1:6379"; fi
  if [[ "$ru" =~ (localhost|127\.0\.0\.1):6379 ]] && ! ss -ltnH 'sport = :6379' | grep -q .; then
    PROFILES="${PROFILES:+$PROFILES,}redis"; ok "no Redis running on this server — bundling one"
  fi
  [ "$proxy" = caddy ] && PROFILES="${PROFILES:+$PROFILES,}caddy"
  set_env COMPOSE_PROFILES "${PROFILES:-}"

  # ---- secrets the new code needs
  if [ -z "$(envv JWT_SECRET)" ]; then
    warn "JWT_SECRET is not set (the old .env spelled it JWT_SECRETE, so logins were signed with the built-in default)."
    if ask_yes "Generate a strong JWT_SECRET now? (everyone logs in again once)" Y; then
      set_env JWT_SECRET "$(openssl rand -hex 32)"; ok "JWT_SECRET generated"
    fi
  fi
  for k in AFRO_MESSAGE_API_KEY CHAPA_SECRET_KEY DO_SPACES_KEY DO_SPACES_SECRET; do
    if [ -z "$(envv $k)" ]; then
      case $k in
        AFRO_MESSAGE_API_KEY) warn "AFRO_MESSAGE_API_KEY missing — SMS / OTP codes will NOT send without it." ;;
        CHAPA_SECRET_KEY)     warn "CHAPA_SECRET_KEY missing — Chapa payments need it." ;;
        DO_SPACES_*)          warn "$k missing — the backend will not start without DigitalOcean Spaces keys." ;;
      esac
      v=$(ask_secret "$k"); [ -z "$v" ] || { set_env "$k" "$v"; ok "$k saved"; }
    fi
  done
  ok "settings written to $envf (only root can read it)"
}

check_dns() {
  local ip; ip=$(public_ip)
  ok "this server: ${ip:-unknown IP}"
  for d in "$(envv ADMIN_DOMAIN)" "$(envv API_DOMAIN)" "$(envv SOCKET_DOMAIN)"; do
    local r; r=$(resolve "$d")
    if [ -z "$r" ]; then warn "$d has no DNS record — add an A record → $ip"
    elif [ -n "$ip" ] && [[ " $r " != *" $ip "* ]]; then warn "$d points to $r, not this server ($ip). People cannot reach it until the DNS A record is $ip."
    else ok "$d → $r"; fi
  done
  # www → main domain redirect, only if www already points here
  local admin www; admin="$(envv ADMIN_DOMAIN)"; www="www.$admin"
  rm -f "$APP_DIR/caddy-extra/www.caddy"
  if [ "$(envv PROXY)" = caddy ] && [[ "$admin" != www.* ]] && [ -n "$ip" ] && [[ " $(resolve "$www") " == *" $ip "* ]]; then
    printf '%s {\n\tredir https://%s{uri} permanent\n}\n' "$www" "$admin" > "$APP_DIR/caddy-extra/www.caddy"
    ok "$www → redirects to https://$admin"
  fi
}

get_images() {
  if [ -n "${GHCR_TOKEN:-}" ]; then echo "$GHCR_TOKEN" | docker login ghcr.io -u "${GHCR_USER:-token}" --password-stdin >/dev/null; fi
  # Images of exactly the code just pulled (CI tags each commit). Not on ghcr.io
  # yet (CI still running / failed / private)? → built here from that code.
  IMAGE_TAG="${IMAGE_TAG:-$(git -C "$APP_DIR" rev-parse HEAD)}"; export IMAGE_TAG
  set_env IMAGE_TAG "$IMAGE_TAG"
  ok "deploying commit ${IMAGE_TAG:0:7}"
  local build_admin=0
  # CI images have api./socket.wheellol.com baked in; other domains need a local admin build
  [ "$(envv API_DOMAIN)" = "api.wheellol.com" ] && [ "$(envv SOCKET_DOMAIN)" = "socket.wheellol.com" ] || build_admin=1
  if dc pull -q backend >/dev/null 2>&1; then ok "backend image downloaded"
  else warn "could not download backend image — building on this server (5–15 min)"; dc build -q backend; ok "backend image built"; fi
  if [ $build_admin = 0 ] && dc pull -q admin >/dev/null 2>&1; then ok "admin image downloaded"
  else echo "  building admin image..."; dc build -q admin; ok "admin image built"; fi
  [[ "$(envv COMPOSE_PROFILES)" != *caddy* ]] || dc pull -q caddy >/dev/null 2>&1 || true
  [[ "$(envv COMPOSE_PROFILES)" != *db* && "$(envv COMPOSE_PROFILES)" != *redis* ]] || dc pull -q postgres redis >/dev/null 2>&1 || true
}

preflight_db() {
  if [[ "$(envv COMPOSE_PROFILES)" == *db* ]]; then ok "bundled database — skipping checks"; return; fi
  local url major out
  url="$(db_url)"
  major=$(pg_major "$url") || die "Cannot connect to the database in DATABASE_URL/DIRECT_URL. Check $APP_DIR/.env"
  ok "database reachable (PostgreSQL $major)"
  out=$(dc run --rm --no-deps -T --entrypoint "" backend npx prisma migrate status 2>&1 || true)
  if echo "$out" | grep -q "Database schema is up to date"; then ok "migrations: up to date"
  elif echo "$out" | grep -q "have not yet been applied"; then
    echo "$out" | sed -n '/have not yet been applied/,/^$/p' | sed 's/^/    /'
    ok "these migrations will be applied when the new backend starts (after the backup)"
  elif echo "$out" | grep -qiE "not managed by Prisma Migrate|P3005"; then
    echo "$out" | tail -5 | sed 's/^/    /'
    die "The database was not created with migrations (prisma db push). Nothing was changed. Ask to baseline it first."
  elif echo "$out" | grep -qi "failed"; then
    echo "$out" | tail -15 | sed 's/^/    /'
    die "A previous migration failed in this database. Nothing was changed — fix it first."
  else
    echo "$out" | tail -10 | sed 's/^/    /'
    ask_yes "Could not read the migration status (above). Continue anyway?" N || die "Stopped. Nothing was changed."
  fi
}

do_backup() {      # do_backup [label]
  local label="${1:-daily}" url major file
  mkdir -p "$APP_DIR/backups"
  file="$APP_DIR/backups/db-$label-$(date +%Y%m%d-%H%M%S).sql.gz"
  if [[ "$(envv COMPOSE_PROFILES)" == *db* ]]; then
    dc exec -T postgres pg_dump -U "$(envv POSTGRES_USER)" -d "$(envv POSTGRES_DB)" --no-owner | gzip > "$file"
  else
    url="$(db_url)"; major=$(pg_major "$url") || die "backup: cannot connect to database"
    docker run --rm --network host postgres:"$major"-alpine pg_dump --no-owner --no-privileges "$url" | gzip > "$file"
    [ "${PIPESTATUS[0]}" = 0 ] || { rm -f "$file"; die "pg_dump failed"; }
  fi
  [ "$(gzip -dc "$file" | head -c 2000 | wc -c)" -gt 500 ] || die "backup looks empty: $file"
  ok "database backup: $file ($(du -h "$file" | cut -f1))"
  ls -1t "$APP_DIR"/backups/db-daily-*.sql.gz 2>/dev/null | tail -n +15 | xargs -r rm -- 2>/dev/null || true
}

# --- old services on our ports -------------------------------------------------
container_of_pid() { grep -oE '[0-9a-f]{64}' "/proc/$1/cgroup" 2>/dev/null | head -1 || true; }
PM2_BIN=""
find_pm2() {
  [ -n "$PM2_BIN" ] && return 0
  PM2_BIN=$(command -v pm2 2>/dev/null || ls -1 /root/.nvm/versions/node/*/bin/pm2 /home/*/.nvm/versions/node/*/bin/pm2 /usr/local/bin/pm2 /usr/bin/pm2 2>/dev/null | tail -1 || true)
  [ -n "$PM2_BIN" ]
}
pm2_as() {  # pm2_as USER PM2_HOME args...
  local u="$1" h="$2"; shift 2
  local p="PATH=$(dirname "$PM2_BIN"):/usr/local/bin:/usr/bin:/bin"
  if [ "$u" = root ]; then env "$p" PM2_HOME="$h" "$PM2_BIN" "$@"; else sudo -u "$u" env "$p" PM2_HOME="$h" "$PM2_BIN" "$@"; fi
}

PLAN=()            # lines: "kind|id|description"
plan_add() { local l; for l in "${PLAN[@]:-}"; do [ "${l%%|*}|$(echo "$l" | cut -d'|' -f2)" = "$1|$2" ] && return; done; PLAN+=("$1|$2|$3"); }

scan_port() {      # scan_port PORT  -> adds what owns it to PLAN (skips our own containers)
  local port="$1" pid cid name unit
  for pid in $(ss -ltnpH "sport = :$port" 2>/dev/null | grep -oE 'pid=[0-9]+' | cut -d= -f2 | sort -u); do
    local comm; comm=$(ps -o comm= -p "$pid" 2>/dev/null || true)
    if [ "$comm" = docker-proxy ]; then
      for cid in $(docker ps -q --filter "publish=$port"); do
        name=$(docker inspect -f '{{.Name}}' "$cid" | tr -d /)
        [[ "$name" == wheellol-* ]] || plan_add docker "$name" "docker container '$name' (port $port)"
      done; continue
    fi
    cid=$(container_of_pid "$pid")
    if [ -n "$cid" ]; then
      name=$(docker inspect -f '{{.Name}}' "$cid" 2>/dev/null | tr -d / || true)
      [[ "$name" == wheellol-* ]] || plan_add docker "$name" "docker container '$name' (port $port)"
      continue
    fi
    local pmid pmhome; pmid=$(tr '\0' '\n' < "/proc/$pid/environ" 2>/dev/null | grep -E '^pm_id=' | cut -d= -f2 || true)
    if [ -n "$pmid" ]; then
      local user pname; user=$(ps -o user= -p "$pid" | tr -d ' ')
      pmhome=$(tr '\0' '\n' < "/proc/$pid/environ" | grep -E '^PM2_HOME=' | cut -d= -f2 || true)
      [ -n "$pmhome" ] || pmhome="$(getent passwd "$user" | cut -d: -f6)/.pm2"
      pname=$(tr '\0' '\n' < "/proc/$pid/environ" | grep -E '^name=' | cut -d= -f2 || true)
      plan_add pm2 "$user:$pmhome:$pmid" "pm2 app '${pname:-$pmid}' (id $pmid, user $user, port $port)"
      continue
    fi
    unit=$(grep -oE '[^/]+\.service' "/proc/$pid/cgroup" 2>/dev/null | head -1 || true)
    if [ -n "$unit" ] && [[ "$unit" != user@* ]] && [[ "$unit" != session-* ]]; then
      local extra=""
      if [ "$unit" = nginx.service ]; then
        extra=" — sites: $(grep -rhoE 'server_name[^;]+' /etc/nginx/sites-enabled /etc/nginx/conf.d 2>/dev/null | sed 's/server_name//' | tr -s ' \n' ' ' | cut -c1-120)"
      fi
      plan_add systemd "$unit" "service $unit (port $port)$extra"; continue
    fi
    plan_add kill "$pid" "process $pid '$(ps -o args= -p "$pid" | cut -c1-60)' (port $port)"
  done
}

switch_over() {
  PLAN=()
  local ports="$OLD_PORTS" t
  [ "$(envv PROXY)" = nginx ] || ports="80 443 $OLD_PORTS"
  for p in $ports; do scan_port "$p"; done
  if [ "$(envv PROXY)" != nginx ]; then
    for t in certbot.timer snap.certbot.renew.timer; do
      systemctl is-enabled "$t" >/dev/null 2>&1 && plan_add timer "$t" "old certificate renewal ($t) — Caddy renews now"
    done
  fi
  if [ "${#PLAN[@]}" -eq 0 ]; then ok "ports $(echo $ports | tr ' ' '/') are free (or already ours)"; return; fi

  echo "  These old services use the ports the new setup needs:"
  for l in "${PLAN[@]}"; do echo "    • $(echo "$l" | cut -d'|' -f3-)"; done
  echo "  They will be stopped (not deleted). 'bash $APP_DIR/deploy.sh rollback' starts them again."
  ask_yes "Stop them and switch to the new setup now?" Y || die "Stopped. The old setup is still running; nothing was changed."

  local rb="$APP_DIR/.deploy-rollback"
  for l in "${PLAN[@]}"; do
    local kind id; kind="${l%%|*}"; id=$(echo "$l" | cut -d'|' -f2)
    case $kind in
      docker)
        local pol; pol=$(docker inspect -f '{{.HostConfig.RestartPolicy.Name}}' "$id")
        docker update --restart=no "$id" >/dev/null; docker stop "$id" >/dev/null
        echo "docker|$id|$pol" >> "$rb" ;;
      pm2)
        find_pm2 || die "pm2 app found but the pm2 command was not — stop it by hand, then re-run."
        local u h i; IFS=: read -r u h i <<< "$id"
        if ! grep -qF "pm2|$u:$h|" "$rb" 2>/dev/null; then   # snapshot once, while everything still runs
          pm2_as "$u" "$h" save >/dev/null 2>&1 || true
          cp "$h/dump.pm2" "$APP_DIR/.deploy-pm2-$(echo "$h" | tr / _).dump" 2>/dev/null || true
          echo "pm2|$u:$h|" >> "$rb"
        fi
        pm2_as "$u" "$h" delete "$i" >/dev/null
        pm2_as "$u" "$h" save >/dev/null 2>&1 || true ;;
      systemd) systemctl stop "$id"; systemctl disable "$id" >/dev/null 2>&1 || true; echo "systemd|$id|" >> "$rb" ;;
      timer)   systemctl disable --now "$id" >/dev/null 2>&1 || true; echo "systemd|$id|" >> "$rb" ;;
      kill)    kill "$id" 2>/dev/null || true; sleep 2; kill -9 "$id" 2>/dev/null || true; echo "kill|$id|" >> "$rb" ;;
    esac
    ok "stopped: $(echo "$l" | cut -d'|' -f3- | cut -c1-90)"
  done
  sleep 2
  for p in $ports; do
    ss -ltnpH "sport = :$p" | grep -v docker-proxy | grep -q . && warn "port $p is still in use: $(ss -ltnpH "sport = :$p" | head -1)"
  done
  return 0
}

rollback() {
  need_root
  local rb="$APP_DIR/.deploy-rollback"
  [ -f "$rb" ] || die "Nothing to roll back ($rb not found)."
  step "Rolling back to the old setup"
  dc stop backend caddy admin >/dev/null 2>&1 || true; ok "new stack stopped (data and certificates kept)"
  while IFS='|' read -r kind id extra; do
    case $kind in
      docker)  docker update --restart="${extra:-unless-stopped}" "$id" >/dev/null; docker start "$id" >/dev/null && ok "started container $id" ;;
      systemd) systemctl enable --now "$id" >/dev/null 2>&1 && ok "started $id" ;;
      pm2)     find_pm2 || { warn "pm2 not found"; continue; }
               local u h; IFS=: read -r u h <<< "$id"
               local d="$APP_DIR/.deploy-pm2-$(echo "$h" | tr / _).dump"
               [ -f "$d" ] && cp "$d" "$h/dump.pm2"
               pm2_as "$u" "$h" resurrect >/dev/null && pm2_as "$u" "$h" save >/dev/null 2>&1 && ok "pm2 apps restored ($h)" ;;
      kill)    warn "process $id was a plain process — start it by hand" ;;
    esac
  done < "$rb"
  mv "$rb" "$rb.done-$(date +%s)"
  echo; echo "  Old setup is back. Run 'bash $APP_DIR/deploy.sh' again when ready."
}

start_stack() {
  dc up -d --no-build --remove-orphans
  echo "  waiting for the backend (migrations run first)..."
  local i
  for i in $(seq 1 75); do
    if [ "$(dc logs backend 2>&1 | grep -c "Gateway listening")" -gt 0 ]; then ok "backend running"; return 0; fi
    sleep 2
  done
  warn "backend did not start in time. Last log lines:"
  dc logs --tail 40 backend | sed 's/^/    /'
  if [ -f "$APP_DIR/.deploy-rollback" ] && ask_yes "Roll back to the old setup now?" Y; then rollback; exit 1; fi
  die "Fix the problem above, then run deploy.sh again."
}

migrations_report() {
  local out; out=$(dc exec -T backend npx prisma migrate status 2>&1 || true)
  if echo "$out" | grep -q "Database schema is up to date"; then
    ok "migrations: all applied ($(echo "$out" | grep -oE '[0-9]+ migrations? found' | head -1))"
  else
    warn "migrations are not fully applied:"; echo "$out" | tail -12 | sed 's/^/    /'
  fi
}

prune_old_images() {  # keep the running tag + the one before it (for a quick manual rollback)
  local r
  for r in "$(envv BACKEND_IMAGE)" "$(envv ADMIN_IMAGE)"; do
    [ -n "$r" ] || continue
    docker images "$r" --format '{{.Tag}}' | grep -vxE "${IMAGE_TAG:-latest}|latest|<none>" | tail -n +2 \
      | while read -r t; do docker rmi "$r:$t" >/dev/null 2>&1 || true; done
  done
}

verify() {
  local d code i path ip; ip=$(public_ip)
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "http://127.0.0.1:$(envv ADMIN_PORT)/" || true)
  if [ "$code" = 200 ]; then ok "admin container answers on 127.0.0.1:$(envv ADMIN_PORT)"
  else warn "admin container does not answer on 127.0.0.1:$(envv ADMIN_PORT) (HTTP $code) — check: bash $APP_DIR/deploy.sh logs admin"; fi
  for d in "$(envv ADMIN_DOMAIN)" "$(envv API_DOMAIN)" "$(envv SOCKET_DOMAIN)"; do
    path="/"; [ "$d" = "$(envv SOCKET_DOMAIN)" ] && path="/socket.io/?EIO=4&transport=polling"
    code=000
    for i in $(seq 1 12); do
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$d:443:127.0.0.1" "https://$d$path" || true)
      [ "$code" != 000 ] && break; sleep 5
    done
    # if [ "$code" != 000 ]; then ok "https://$d  (HTTP $code, certificate $(cert_info "$d"))"
    if [ "${code:0:1}" = 5 ]; then warn "https://$d answers HTTP $code — nginx/Caddy cannot reach the app behind it (check: bash $APP_DIR/deploy.sh logs)"
    elif [ "$code" != 000 ]; then ok "https://$d  (HTTP $code, certificate $(cert_info "$d"))"
    else
      code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 --resolve "$d:80:127.0.0.1" "http://$d$path" || true)
      if [ "$code" != 000 ]; then warn "$d works over http (HTTP $code); HTTPS comes once its DNS points to ${ip:-this server} — then run deploy.sh again"
      else warn "$d does not answer — check: bash $APP_DIR/deploy.sh logs"; fi
    fi
    [ -z "$ip" ] || [[ " $(resolve "$d") " == *" $ip "* ]] || warn "  outside users cannot reach $d yet (DNS → $(resolve "$d"))"
  done
}

# --- nginx mode: add/update only the Wheellol sites, certbot does certificates ----
nginx_names() { grep -RhsE '^[[:space:]]*server_name[^;]+' /etc/nginx/sites-enabled /etc/nginx/conf.d | sed -E 's/^[[:space:]]*server_name//; s/;.*//' | tr -s ' \t' '\n' | grep -v '^_\?$' | sort -u | tr '\n' ' '; }
nginx_site_for() {  # file that has "server_name ... DOMAIN"
  local re="${1//./\\.}"
  grep -RlsE "^[[:space:]]*server_name([^;]*[[:space:]])?$re([[:space:];]|\$)" /etc/nginx/sites-enabled /etc/nginx/conf.d | head -1 || true
}
nginx_point_site() {  # nginx_point_site FILE DOMAIN UPSTREAM -> proxy_pass in DOMAIN's server blocks goes to UPSTREAM
  local f d="$2" up="$3" tmp; f=$(readlink -f "$1"); tmp=$(mktemp)
  awk -v dom="${d//./[.]}" -v up="$up" '
    function flush(   i, hit) {
      hit = 0
      for (i = 1; i <= n; i++) if (buf[i] ~ /^[[:space:]]*server_name/ && (buf[i] " ") ~ ("[[:space:]]" dom "[[:space:];]")) hit = 1
      for (i = 1; i <= n; i++) {
        if (hit && buf[i] ~ /^[[:space:]]*proxy_pass[[:space:]]/) sub(/proxy_pass[[:space:]]+[^;]+;/, "proxy_pass http://" up ";", buf[i])
        print buf[i]
      }
      n = 0
    }
    {
      if (depth == 0 && $0 ~ /^[[:space:]]*server[[:space:]]*\{/) inblk = 1
      if (inblk) buf[++n] = $0; else print
      o = gsub(/\{/, "{"); c = gsub(/\}/, "}"); depth += o - c
      if (inblk && depth == 0) { flush(); inblk = 0 }
    }
    END { if (n) flush() }
  ' "$f" > "$tmp"
  if [ -s "$tmp" ] && ! cmp -s "$tmp" "$f"; then cat "$tmp" > "$f"; ok "nginx: $d → $up (updated existing site $f)"; fi
  rm -f "$tmp"
}

nginx_setup() {
  command -v nginx >/dev/null || die "PROXY=nginx in $APP_DIR/.env but nginx is not installed."
  local f d up w ip bk="$APP_DIR/backups/nginx-$(date +%Y%m%d-%H%M%S).tgz"; ip=$(public_ip)
  local -a created=()
  tar czf "$bk" -C / etc/nginx && ok "nginx config backed up: $bk"
  ls -1t "$APP_DIR"/backups/nginx-*.tgz 2>/dev/null | tail -n +6 | xargs -r rm -- 2>/dev/null || true

  # the backend now listens on 127.0.0.1 only; "localhost" can mean ::1 first
  for f in $(grep -RlsE 'proxy_pass[[:space:]]+http://localhost:(3000|4004)\b' /etc/nginx/sites-enabled /etc/nginx/conf.d); do
    f=$(readlink -f "$f")
    sed -i -E 's#(proxy_pass[[:space:]]+http://)localhost:(3000|4004)\b#\1127.0.0.1:\2#g' "$f"
    ok "nginx: $f → 127.0.0.1:3000/4004 (was localhost)"
  done

  local -a nocert=()
  for w in "$(envv ADMIN_DOMAIN)|127.0.0.1:$(envv ADMIN_PORT)" "$(envv API_DOMAIN)|127.0.0.1:3000" "$(envv SOCKET_DOMAIN)|127.0.0.1:4004"; do
    d="${w%%|*}"; up="${w#*|}"
    f=$(nginx_site_for "$d")
    if [ -z "$f" ]; then
      local dir=/etc/nginx/conf.d; [ -d /etc/nginx/sites-enabled ] && dir=/etc/nginx/sites-available
      f="$dir/wheellol-$d.conf"
      cat > "$f" <<EOF
# Added by Wheellol deploy.sh. certbot adds the HTTPS part.
server {
    listen 80;
    listen [::]:80;
    server_name $d;
    client_max_body_size 50m;
    location / {
        proxy_pass http://$up;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 3600s;
    }
}
EOF
      created+=("$f")
      [ "$dir" = /etc/nginx/sites-available ] && { ln -sf "$f" "/etc/nginx/sites-enabled/wheellol-$d.conf"; created+=("/etc/nginx/sites-enabled/wheellol-$d.conf"); }
      ok "nginx: new site $d → $up"
    elif [ "$d" = "$(envv ADMIN_DOMAIN)" ]; then
      # an admin site from the old setup still points at the old admin app (→ 502); send it to the admin container
      nginx_point_site "$f" "$d" "$up"
    fi
    [ "$(cert_info "$d")" != "no certificate for this name yet" ] || nocert+=("$d")
  done

  if ! nginx -t >/dev/null 2>&1; then
    nginx -t 2>&1 | tail -3 | sed 's/^/    /'
    rm -f "${created[@]}"; tar xzf "$bk" -C /
    systemctl reload nginx || true
    die "nginx config test failed — restored the previous nginx config."
  fi
  systemctl reload nginx; ok "nginx reloaded (other sites unchanged)"

  for d in "${nocert[@]}"; do
    if [ -n "$ip" ] && [[ " $(resolve "$d") " == *" $ip "* ]]; then
      command -v certbot >/dev/null || pkg_install certbot python3-certbot-nginx
      if certbot --nginx -d "$d" --non-interactive --agree-tos -m "$(envv ACME_EMAIL)" --redirect --keep-until-expiring >/dev/null 2>&1; then
        ok "certificate for $d issued (certbot)"
      else warn "certbot could not get a certificate for $d — see /var/log/letsencrypt/letsencrypt.log"; fi
    else
      warn "no HTTPS certificate for $d yet: its DNS must point to ${ip:-this server} first, then run deploy.sh again"
    fi
  done
  if systemctl is-enabled -q certbot.timer 2>/dev/null || systemctl is-enabled -q snap.certbot.renew.timer 2>/dev/null; then
    ok "certificates renew automatically (certbot timer)"
  elif command -v certbot >/dev/null; then
    systemctl enable --now certbot.timer >/dev/null 2>&1 && ok "certbot renewal timer switched on" || warn "certbot renewal timer missing — add: certbot renew (daily cron)"
  fi
}

install_cron() {
  cat > /etc/cron.d/wheellol <<EOF
# Wheellol: daily database backup (keeps 14). Certificates renew via Caddy or certbot.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
30 2 * * * root bash $APP_DIR/deploy.sh backup >> $APP_DIR/backups/backup.log 2>&1
EOF
  ok "daily database backup at 02:30 (cron)"
}

status() {
  [ -f "$APP_DIR/.env" ] || die "Not set up yet ($APP_DIR/.env missing)."
  step "Services"; dc ps --format 'table {{.Service}}\t{{.State}}\t{{.Status}}'
  step "HTTPS certificates ($(envv PROXY) renews them ~30 days before expiry)"
  for d in "$(envv ADMIN_DOMAIN)" "$(envv API_DOMAIN)" "$(envv SOCKET_DOMAIN)"; do
    local info; info=$(cert_info "$d"); echo "  $d: $info"
    [[ "$info" =~ \(([0-9-]+)\ days ]] && [ "${BASH_REMATCH[1]}" -lt 20 ] && warn "renewal is late — check: $([ "$(envv PROXY)" = nginx ] && echo 'certbot renew --dry-run' || echo 'docker compose logs caddy')"
  done
  step "Backups"; ls -1t "$APP_DIR"/backups/*.sql.gz 2>/dev/null | head -3 | sed 's/^/  /' || echo "  none yet"
  step "Disk"; df -h / | tail -1 | awk '{print "  used "$3" of "$2" ("$5")"}'
}

setup() {
  need_root
  echo "${B}Wheellol deploy → $APP_DIR${N}"
  step "Server packages";  install_base
  step "Code";             get_code
  step "Settings (.env)"
  if [ -f "$APP_DIR/.env" ]; then ok "using existing $APP_DIR/.env"; else make_env; fi
  if [ -z "$(envv PROXY)" ]; then
    set_env PROXY caddy; [[ "$(envv COMPOSE_PROFILES)" == *caddy* ]] || set_env COMPOSE_PROFILES "$(envv COMPOSE_PROFILES | sed 's/^$/caddy/; t; s/$/,caddy/')"
  fi
  step "DNS";              check_dns
  step "Docker images";    get_images
  step "Database check";   preflight_db
  step "Database backup";  if [[ "$(envv COMPOSE_PROFILES)" == *db* ]] && ! dc ps -q postgres | grep -q .; then ok "new database — nothing to back up yet"; else do_backup predeploy; fi
  if [ "${1:-}" = check ]; then
    echo; echo "${G}${B}Check finished — nothing was switched.${N} The old setup is still running."
    echo "  Switch over with:  bash $APP_DIR/deploy.sh"; return 0
  fi
  step "Switch over";      switch_over
  step "Start";            start_stack
  migrations_report
  [ "$(envv PROXY)" != nginx ] || { step "nginx sites";  nginx_setup; }
  step "Verify";           verify
  install_cron
  prune_old_images
  docker image prune -f >/dev/null 2>&1 || true

  echo
  echo "${G}${B}Done.${N}"
  echo "  Admin   https://$(envv ADMIN_DOMAIN)"
  echo "  API     https://$(envv API_DOMAIN)"
  echo "  Socket  https://$(envv SOCKET_DOMAIN)"
  echo "  Status / cert expiry:  bash $APP_DIR/deploy.sh status"
  echo "  Logs:                  bash $APP_DIR/deploy.sh logs"
  [ -f "$APP_DIR/.deploy-rollback" ] && echo "  Undo (old setup back): bash $APP_DIR/deploy.sh rollback"
  return 0
}

# (tests can source the functions without running anything)
[ "${WL_SOURCE_ONLY:-}" = 1 ] && return 0

cd /
case "${1:-setup}" in
  setup|update) setup ;;
  check)        setup check ;;
  status)       status ;;
  backup)       need_root; do_backup daily ;;
  logs)         dc logs -f --tail 100 "${@:2}" ;;
  rollback)     rollback ;;
  *) echo "usage: deploy.sh [user@host] [setup|check|status|backup|logs|rollback]"; exit 1 ;;
esac
