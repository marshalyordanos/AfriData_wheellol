# Wheellol backend: all five Nest services (gateway, auth, operations,
# rental-service, notify-hub) run in one container, because the gateway
# talks to the others on 127.0.0.1 (see src/gateway/clients.module.ts).

FROM node:20-bookworm-slim AS build
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build


FROM node:20-bookworm-slim
WORKDIR /app
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
# Full node_modules on purpose: `prisma` (migrations) and `concurrently`
# (process runner) are devDependencies but are needed at runtime.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/scripts ./scripts
COPY package.json docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# 3000 = REST gateway, 4004 = notify-hub (socket.io). 4001-4003 stay internal.
EXPOSE 3000 4004

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["npm", "run", "start:prod"]
