FROM node:24-alpine AS base
ENV DOCKER_BUILD=true
RUN corepack enable
WORKDIR /app

# Install ALL deps for building (Nest CLI, vitest, etc. are dev deps).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter @food-delivery/api generate
RUN pnpm --filter @food-delivery/api build

# Slim production install: drops vitest, testcontainers, @nestjs/cli,
# etc. so the runtime image is materially smaller and surfaces fewer
# CVEs. `prisma` (CLI) and `tsx` (seed runner) are intentionally listed
# as runtime deps because the entrypoint invokes them.
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/api-client/package.json packages/api-client/package.json
COPY apps/api/prisma apps/api/prisma
COPY apps/api/prisma.config.ts apps/api/prisma.config.ts
RUN pnpm install --frozen-lockfile --prod
RUN pnpm --filter @food-delivery/api generate

FROM node:24-alpine AS runtime
RUN corepack enable && addgroup -S app && adduser -S app -G app
WORKDIR /app
ENV NODE_ENV=production
COPY --from=prod-deps /app/package.json /app/pnpm-lock.yaml /app/pnpm-workspace.yaml ./
COPY --from=prod-deps /app/apps/api/package.json apps/api/package.json
COPY --from=prod-deps /app/node_modules node_modules
COPY --from=prod-deps /app/apps/api/node_modules apps/api/node_modules
COPY --from=build /app/apps/api/dist apps/api/dist
COPY --from=build /app/apps/api/prisma apps/api/prisma
COPY --from=build /app/apps/api/prisma.config.ts apps/api/prisma.config.ts
COPY --from=build /app/apps/api/scripts apps/api/scripts
RUN chown -R app:app /app
USER app
EXPOSE 3000

# Lightweight readiness check using a Node one-liner so we don't pull
# in curl/wget. The endpoint at /health/ready also verifies database
# connectivity, which is what `depends_on: condition: service_healthy`
# in docker-compose actually needs.
HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health/ready',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["sh", "/app/apps/api/scripts/docker-entrypoint.sh"]
